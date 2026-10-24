import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { CartService } from './core/cart.service';
import { Product } from './core/product.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {
  private selectedSubject = new BehaviorSubject<Product | null>(null);
  readonly selected$ = this.selectedSubject.asObservable();

  private subs: Subscription[] = [];

  constructor(private cart: CartService) {}

  ngOnInit(): void {
    this.subs.push(
      combineLatest([this.cart.drawer$, this.selected$]).subscribe(([drawerOpen, selected]) => {
        if (typeof document !== 'undefined') {
          const locked = !!(drawerOpen || selected);
          document.body.style.overflow = locked ? 'hidden' : '';
          document.documentElement.style.overflow = locked ? 'hidden' : '';
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  openProduct(product: Product): void {
    this.selectedSubject.next(product);
  }

  closeProduct(): void {
    this.selectedSubject.next(null);
  }
}
