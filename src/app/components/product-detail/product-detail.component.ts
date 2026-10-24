import { Component, EventEmitter, HostListener, Input, OnChanges, Output } from '@angular/core';
import { CATEGORY_LABEL, Product } from '../../core/product.model';
import { CartService } from '../../core/cart.service';
import { ToastService } from '../../core/toast.service';
import { backdropAnimation, modalAnimation } from '../../shared/animations';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  animations: [modalAnimation, backdropAnimation]
})
export class ProductDetailComponent implements OnChanges {
  @Input() product: Product;
  @Output() close = new EventEmitter<void>();

  selectedColor: string;
  qty = 1;
  readonly categoryLabels = CATEGORY_LABEL;

  constructor(private cart: CartService, private toast: ToastService) {}

  ngOnChanges(): void {
    if (this.product) {
      this.selectedColor = this.product.colors[0].name;
      this.qty = 1;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close.emit();
  }

  get stockLabel(): string {
    if (this.product.stock <= 10) {
      return `Últimas ${this.product.stock} unidades`;
    }
    return 'Disponible · envío en 24 h';
  }

  setColor(name: string): void {
    this.selectedColor = name;
  }

  changeQty(delta: number): void {
    this.qty = Math.min(10, Math.max(1, this.qty + delta));
  }

  addToCart(): void {
    this.cart.add(this.product, this.selectedColor, this.qty);
    this.toast.show(`${this.product.name} (${this.selectedColor}) añadido`);
    this.close.emit();
    this.cart.openDrawer();
  }
}
