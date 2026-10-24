import { Component, EventEmitter, Output } from '@angular/core';
import { CATEGORIES, CategoryId, Product } from '../../core/product.model';
import { PRODUCTS } from '../../core/products.data';
import { gridAnimation } from '../../shared/animations';

type SortId = 'destacados' | 'precio-asc' | 'precio-desc' | 'novedades' | 'valoracion';

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.component.html',
  animations: [gridAnimation]
})
export class CatalogComponent {
  @Output() quickView = new EventEmitter<Product>();

  readonly products = PRODUCTS;
  readonly categories = CATEGORIES;

  activeCategory: CategoryId | 'todos' = 'todos';
  sort: SortId = 'destacados';
  wished = new Set<string>();

  readonly sortOptions: { id: SortId; label: string }[] = [
    { id: 'destacados', label: 'Más vendidos' },
    { id: 'novedades', label: 'Novedades' },
    { id: 'precio-asc', label: 'Precio: de menor a mayor' },
    { id: 'precio-desc', label: 'Precio: de mayor a menor' },
    { id: 'valoracion', label: 'Mejor valorados' }
  ];

  get filtered(): Product[] {
    let list =
      this.activeCategory === 'todos'
        ? [...this.products]
        : this.products.filter((p) => p.category === this.activeCategory);

    switch (this.sort) {
      case 'precio-asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'precio-desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'novedades':
        list.sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew) || b.sales - a.sales);
        break;
      case 'valoracion':
        list.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
        break;
      default:
        list.sort((a, b) => Number(!!b.bestseller) - Number(!!a.bestseller) || b.sales - a.sales);
    }
    return list;
  }

  get animationKey(): string {
    return `${this.activeCategory}-${this.sort}`;
  }

  countFor(id: CategoryId | 'todos'): number {
    return id === 'todos' ? this.products.length : this.products.filter((p) => p.category === id).length;
  }

  selectCategory(id: CategoryId | 'todos'): void {
    this.activeCategory = id;
  }

  openProduct(product: Product): void {
    this.quickView.emit(product);
  }

  toggleWish(id: string): void {
    if (this.wished.has(id)) {
      this.wished.delete(id);
    } else {
      this.wished.add(id);
    }
  }
}
