import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { BUSINESS_TYPE_LABEL, CATEGORY_LABEL, Product } from '../../core/product.model';
import { CatalogService, COUNTRY_LABEL } from '../../core/catalog/catalog.service';
import { CartService } from '../../core/cart.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-product-page',
  templateUrl: './product-page.component.html'
})
export class ProductPageComponent implements OnInit, OnDestroy {
  product: Product | null = null;
  related: Product[] = [];
  qty = 1;
  activeImage = '';
  readonly categoryLabels = CATEGORY_LABEL;

  private sub: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private catalog: CatalogService,
    private cart: CartService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.sub = this.route.params.subscribe((params) => {
      const product = this.catalog.byId(params.id);
      if (!product) {
        this.router.navigate(['/404']);
        return;
      }
      this.product = product;
      this.activeImage = product.images[0];
      this.qty = 1;
      this.related = this.catalog
        .byCategory(product.category)
        .filter((item) => item.id !== product.id)
        .slice(0, 4);
    });
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  get originLabel(): string {
    const country = this.product ? this.product.supplier.country : '';
    return COUNTRY_LABEL[country] || country || 'Origen no indicado';
  }

  get businessTypeLabel(): string {
    const type = this.product ? this.product.supplier.businessType : '';
    return BUSINESS_TYPE_LABEL[type] || 'Proveedor';
  }

  trackById(_index: number, product: Product): string {
    return product.id;
  }

  changeQty(delta: number): void {
    this.qty = Math.min(10, Math.max(1, this.qty + delta));
  }

  setImage(url: string): void {
    this.activeImage = url;
  }

  addToCart(): void {
    if (!this.product) {
      return;
    }
    this.cart.add(this.product, this.qty);
    this.toast.show(`${this.product.name} (${this.qty} ${this.qty === 1 ? 'ud.' : 'uds.'}) añadido`);
    this.cart.openDrawer();
  }

  buyNow(): void {
    if (!this.product) {
      return;
    }
    this.cart.add(this.product, this.qty);
    this.router.navigate(['/checkout']);
  }
}
