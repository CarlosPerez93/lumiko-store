import { Component } from '@angular/core';
import { Product } from '../../core/product.model';
import { CatalogService } from '../../core/catalog/catalog.service';
import { CartService } from '../../core/cart.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html'
})
export class HeroComponent {
  readonly featured: Product | null;

  readonly marquee = [
    'Envío gratis desde 49 €',
    'Pago seguro con Stripe',
    'Control por app y voz',
    'Garantía oficial 3 años',
    'Entrega express 24/48h',
    'Devolución en 14 días'
  ];

  constructor(
    private catalog: CatalogService,
    private cart: CartService,
    private toast: ToastService
  ) {
    const [first] = this.catalog.featured(1);
    this.featured = first || null;
  }

  get stats(): { value: string; label: string }[] {
    const s = this.catalog.stats();
    return [
      { value: String(s.products), label: 'diseños exclusivos' },
      { value: '24-48h', label: 'envío express' },
      { value: '3 años', label: 'garantía oficial' }
    ];
  }

  scrollTo(id: string): void {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  addFeatured(): void {
    if (!this.featured) {
      return;
    }
    this.cart.add(this.featured);
    this.toast.show(`${this.featured.name} añadido al carrito`);
    this.cart.openDrawer();
  }
}
