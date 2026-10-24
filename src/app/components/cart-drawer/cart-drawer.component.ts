import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CartLine, CartService, CartState } from '../../core/cart.service';
import { ToastService } from '../../core/toast.service';
import { backdropAnimation, drawerAnimation } from '../../shared/animations';

@Component({
  selector: 'app-cart-drawer',
  templateUrl: './cart-drawer.component.html',
  animations: [drawerAnimation, backdropAnimation]
})
export class CartDrawerComponent implements OnInit, OnDestroy {
  open = false;
  state: CartState;
  couponInput = '';
  couponMessage = '';
  couponError = false;

  private subs: Subscription[] = [];

  constructor(private cart: CartService, private toast: ToastService) {}

  ngOnInit(): void {
    this.subs.push(this.cart.drawer$.subscribe((open) => (this.open = open)));
    this.subs.push(
      this.cart.state$.subscribe((state) => {
        this.state = state;
        if (!state.coupon) {
          this.couponInput = '';
          this.couponMessage = '';
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  close(): void {
    this.cart.closeDrawer();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) {
      this.close();
    }
  }

  increment(line: CartLine): void {
    this.cart.increment(line);
  }

  decrement(line: CartLine): void {
    this.cart.decrement(line);
  }

  remove(line: CartLine): void {
    this.cart.remove(line);
    this.toast.show(`${line.product.name} eliminado`, 'info');
  }

  applyCoupon(): void {
    const result = this.cart.applyCoupon(this.couponInput);
    this.couponMessage = result.message;
    this.couponError = !result.ok;
  }

  removeCoupon(): void {
    this.cart.removeCoupon();
    this.couponInput = '';
    this.couponMessage = '';
  }

  checkout(): void {
    if (!this.state || this.state.count === 0) {
      return;
    }
    this.toast.show('Demo: el pedido se ha simulado, la pasarela de pago no está conectada.', 'info');
  }

  goToCatalog(): void {
    this.close();
    const target = document.getElementById('catalogo');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
