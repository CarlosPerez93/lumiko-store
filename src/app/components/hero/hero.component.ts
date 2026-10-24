import { Component } from '@angular/core';
import { Product } from '../../core/product.model';
import { PRODUCTS } from '../../core/products.data';
import { CartService } from '../../core/cart.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html'
})
export class HeroComponent {
  readonly featured: Product = PRODUCTS[0];

  readonly marquee = [
    'Envío gratis desde 49 €',
    'Garantía de 2 años',
    'Control por app y voz',
    'Diseñado en Barcelona',
    'Pago 100 % seguro',
    'Devolución en 30 días',
    'Soporte con personas reales'
  ];

  readonly stats = [
    { value: '12.400+', label: 'hogares iluminados' },
    { value: '4,9/5', label: '1.842 reseñas' },
    { value: '24/48 h', label: 'entrega península' }
  ];

  constructor(private cart: CartService, private toast: ToastService) {}

  scrollTo(id: string): void {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  addFeatured(): void {
    this.cart.add(this.featured, this.featured.colors[0].name, 1);
    this.toast.show(`${this.featured.name} añadida al carrito`);
    this.cart.openDrawer();
  }
}
