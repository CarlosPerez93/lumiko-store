import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService, CartState } from '../../core/cart.service';
import { PaymentError, PaymentService } from '../../core/payment.service';

@Component({
  selector: 'app-checkout-page',
  templateUrl: './checkout-page.component.html'
})
export class CheckoutPageComponent implements OnInit, OnDestroy {
  state: CartState | null = null;
  form: FormGroup;
  submitting = false;
  errorMessage = '';

  private sub: Subscription;

  readonly countries = ['España', 'Portugal', 'Francia', 'Alemania', 'Italia', 'Países Bajos', 'Bélgica'];

  constructor(
    private fb: FormBuilder,
    private cart: CartService,
    private payments: PaymentService,
    private router: Router
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      address: ['', [Validators.required, Validators.minLength(6)]],
      city: ['', [Validators.required]],
      postalCode: ['', [Validators.required, Validators.pattern(/^[0-9A-Za-z\s-]{3,10}$/)]],
      country: ['España', [Validators.required]],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.sub = this.cart.state$.subscribe((state) => {
      this.state = state;
      if (state.count === 0 && !this.submitting) {
        this.router.navigate(['/carrito']);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  isInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  async pay(): Promise<void> {
    if (this.submitting) {
      return;
    }
    this.errorMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Revisa los campos marcados antes de continuar.';
      return;
    }
    if (!this.state || this.state.count === 0) {
      this.errorMessage = 'Tu carrito está vacío.';
      return;
    }

    this.submitting = true;
    const value = this.form.value;
    const items = this.state.lines.map((line) => ({ id: line.product.id, qty: line.qty }));

    this.payments
      .createCheckoutSession(
        items,
        {
          name: value.name,
          email: value.email,
          address: value.address,
          city: value.city,
          postalCode: value.postalCode,
          country: value.country,
          notes: value.notes || undefined
        },
        this.state.coupon
      )
      .subscribe({
        next: (session) => {
          if (!session || !session.url) {
            this.submitting = false;
            this.errorMessage = 'La pasarela no ha devuelto una URL de pago válida. Inténtalo de nuevo.';
            return;
          }
          window.location.href = session.url;
        },
        error: (error: PaymentError) => {
          this.submitting = false;
          this.errorMessage = error && error.message ? error.message : 'No se ha podido iniciar el pago.';
        }
      });
  }

  trackById(_index: number, line: { product: { id: string } }): string {
    return line.product.id;
  }
}
