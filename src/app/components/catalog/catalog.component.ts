import { Component } from '@angular/core';
import { CATEGORIES, CategoryId, Product } from '../../core/product.model';
import { CatalogService, CatalogSort } from '../../core/catalog/catalog.service';
import { gridAnimation } from '../../shared/animations';

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.component.html',
  animations: [gridAnimation]
})
export class CatalogComponent {
  readonly categories = CATEGORIES;
  readonly sortOptions: { id: CatalogSort; label: string }[] = [
    { id: 'destacados', label: 'Más vendidos' },
    { id: 'precio-asc', label: 'Precio: de menor a mayor' },
    { id: 'precio-desc', label: 'Precio: de mayor a menor' },
    { id: 'valoracion', label: 'Mejor valorados' }
  ];

  activeCategory: CategoryId | 'todos' = 'todos';
  sort: CatalogSort = 'destacados';
  wished = new Set<string>();

  constructor(private catalog: CatalogService) {}

  get products(): Product[] {
    return this.catalog.all();
  }

  get filtered(): Product[] {
    return this.catalog.search('', this.activeCategory, this.sort);
  }

  get animationKey(): string {
    return `${this.activeCategory}-${this.sort}`;
  }

  get stats() {
    return this.catalog.stats();
  }

  countFor(id: CategoryId | 'todos'): number {
    return this.catalog.countFor(id);
  }

  selectCategory(id: CategoryId | 'todos'): void {
    this.activeCategory = id;
  }

  toggleWish(id: string): void {
    if (this.wished.has(id)) {
      this.wished.delete(id);
    } else {
      this.wished.add(id);
    }
  }
}
