import { Component } from '@angular/core';
import { CatalogService } from '../../core/catalog/catalog.service';
import { Product } from '../../core/product.model';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html'
})
export class NotFoundComponent {
  readonly suggestions: Product[];

  constructor(private catalog: CatalogService) {
    this.suggestions = catalog.search('', 'todos', 'destacados').slice(0, 4);
  }

  trackById(_index: number, product: Product): string {
    return product.id;
  }
}
