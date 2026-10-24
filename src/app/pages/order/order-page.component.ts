import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService } from '../../core/cart.service';
import { OrderSummary, PaymentError, PaymentService } from '../../core/payment.service';

type OrderView = 'loading' | 'paid' | 'pending' | 'canceled' | 'error';

@Component({
  selector: 'app-order-page',
  templateUrl: './order-page.component.html'
})
export class OrderPageComponent implements OnInit, OnDestroy {
  view: OrderView = 'loading';
  order: OrderSummary | null = null;
  message = '';
  sessionId = '';

  private sub: Subscription;
  private cleared = false;

  constructor(
    private route: ActivatedRoute,
    private payments: PaymentService,
    private cart: CartService
  ) {}

  ngOnInit(): void {
    this.sub = this.route.queryParams.subscribe((params) => {
      if (params.canceled) {
        this.view = 'canceled';
        this.message = 'Has cancelado el pago en Stripe. Tu carrito sigue intacto, puedes intentarlo de nuevo.';
        return;
      }
      const sessionId = params.session_id;
      if (!sessionId) {
        this.view = 'error';
        this.message = 'No hemos recibido la referencia del pago. Si has pagado, revisa tu correo de confirmación.';
        return;
      }
      this.sessionId = sessionId;
      this.load(sessionId);
    });
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  private load(sessionId: string): void {
    this.view = 'loading';
    this.message = '';

    this.payments.getOrder(sessionId).subscribe({
      next: (order) => {
        this.order = order;
        if (order.paymentStatus === 'paid') {
          this.view = 'paid';
          if (!this.cleared) {
            this.cleared = true;
            this.cart.clear();
          }
          return;
        }
        if (order.paymentStatus === 'unpaid' || order.paymentStatus === 'processing') {
          this.view = 'pending';
          this.message =
            'Stripe todavía está confirmando el pago. Esta página se actualiza sola: no cierres la pestaña.';
          setTimeout(() => this.load(sessionId), 5000);
          return;
        }
        this.view = 'error';
        this.message = 'El pago no se ha completado. Puedes volver al checkout e intentarlo de nuevo.';
      },
      error: (error: PaymentError) => {
        this.view = 'error';
        this.message =
          error && error.message
            ? error.message
            : 'No hemos podido recuperar el pedido. Inténtalo de nuevo en unos segundos.';
      }
    });
  }

  get statusLabel(): string {
    if (!this.order) {
      return '';
    }
    switch (this.order.paymentStatus) {
      case 'paid':
        return 'Pagado';
      case 'processing':
        return 'Procesando';
      case 'unpaid':
        return 'Pendiente de pago';
      default:
        return this.order.paymentStatus;
    }
  }
}
