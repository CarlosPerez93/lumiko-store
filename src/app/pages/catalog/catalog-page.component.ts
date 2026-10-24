import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CATEGORIES, CategoryId, Product } from '../../core/product.model';
import { CatalogService, CatalogSort, CatalogStats } from '../../core/catalog/catalog.service';

const VALID_CATEGORIES: string[] = ['lamparas', 'robots', 'proyeccion', 'gaming'];

@Component({
  selector: 'app-catalog-page',
  templateUrl: './catalog-page.component.html'
})
export class CatalogPageComponent implements OnInit, OnDestroy {
  readonly categories = CATEGORIES;
  readonly sortOptions: { id: CatalogSort; label: string }[] = [
    { id: 'destacados', label: 'Más vendidos' },
    { id: 'precio-asc', label: 'Precio: de menor a mayor' },
    { id: 'precio-desc', label: 'Precio: de mayor a menor' },
    { id: 'valoracion', label: 'Mejor valorados' }
  ];

  term = '';
  activeCategory: CategoryId | 'todos' = 'todos';
  sort: CatalogSort = 'destacados';

  private sub: Subscription;

  constructor(private catalog: CatalogService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.sub = this.route.queryParams.subscribe((params) => {
      const category = params.categoria;
      this.activeCategory = VALID_CATEGORIES.indexOf(category) !== -1 ? (category as CategoryId) : 'todos';
      if (params.q) {
        this.term = params.q;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  get results(): Product[] {
    return this.catalog.search(this.term, this.activeCategory, this.sort);
  }

  get stats(): CatalogStats {
    return this.catalog.stats();
  }

  get sources() {
    return this.catalog.sources();
  }

  countFor(id: CategoryId | 'todos'): number {
    return this.catalog.countFor(id);
  }

  selectCategory(id: CategoryId | 'todos'): void {
    this.activeCategory = id;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { categoria: id === 'todos' ? null : id },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  clearFilters(): void {
    this.term = '';
    this.activeCategory = 'todos';
    this.sort = 'destacados';
    this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
  }

  trackById(_index: number, product: Product): string {
    return product.id;
  }
}
