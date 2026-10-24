import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CATEGORY_LABEL, Product } from '../../core/product.model';
import { CartService } from '../../core/cart.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html'
})
export class ProductCardComponent {
  @Input() product: Product;
  @Input() wished = false;
  @Output() quickView = new EventEmitter<Product>();
  @Output() toggleWish = new EventEmitter<string>();

  readonly categoryLabels = CATEGORY_LABEL;

  constructor(private cart: CartService, private toast: ToastService) {}

  get badgeClasses(): string {
    switch (this.product.badgeTone) {
      case 'cyan':
        return 'bg-neon-cyan/15 text-neon-cyan border-neon-cyan/40';
      case 'lime':
        return 'bg-neon-lime/15 text-neon-lime border-neon-lime/40';
      default:
        return 'bg-neon-pink/15 text-neon-pink border-neon-pink/40';
    }
  }

  get discount(): number {
    if (!this.product.oldPrice) {
      return 0;
    }
    return Math.round((1 - this.product.price / this.product.oldPrice) * 100);
  }

  open(): void {
    this.quickView.emit(this.product);
  }

  addToCart(event: Event): void {
    event.stopPropagation();
    this.cart.add(this.product, this.product.colors[0].name, 1);
    this.toast.show(`${this.product.name} añadido al carrito`);
  }

  wish(event: Event): void {
    event.stopPropagation();
    this.toggleWish.emit(this.product.id);
  }
}
