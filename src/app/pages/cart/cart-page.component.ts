import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartLine, CartService, CartState } from '../../core/cart.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-cart-page',
  templateUrl: './cart-page.component.html'
})
export class CartPageComponent implements OnInit, OnDestroy {
  state: CartState | null = null;
  couponInput = '';
  couponMessage = '';
  couponError = false;

  private sub: Subscription;

  constructor(private cart: CartService, private router: Router, private toast: ToastService) {}

  ngOnInit(): void {
    this.sub = this.cart.state$.subscribe((state) => {
      this.state = state;
      if (!state.coupon) {
        this.couponMessage = '';
      }
    });
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
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

  clear(): void {
    this.cart.clear();
    this.toast.show('Carrito vaciado', 'info');
  }

  applyCoupon(): void {
    const result = this.cart.applyCoupon(this.couponInput);
    this.couponMessage = result.message;
    this.couponError = !result.ok;
    if (result.ok) {
      this.couponInput = '';
    }
  }

  removeCoupon(): void {
    this.cart.removeCoupon();
    this.couponInput = '';
    this.couponMessage = '';
  }

  goToCheckout(): void {
    if (!this.state || !this.state.count) {
      return;
    }
    this.router.navigate(['/checkout']);
  }

  trackByProduct(_index: number, line: CartLine): string {
    return line.product.id;
  }
}
