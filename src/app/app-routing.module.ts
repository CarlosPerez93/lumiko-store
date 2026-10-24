import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { CatalogPageComponent } from './pages/catalog/catalog-page.component';
import { ProductPageComponent } from './pages/product/product-page.component';
import { CartPageComponent } from './pages/cart/cart-page.component';
import { CheckoutPageComponent } from './pages/checkout/checkout-page.component';
import { OrderPageComponent } from './pages/order/order-page.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';

const routes: Routes = [
  { path: '', component: HomeComponent, data: { title: 'LUMIKO · Luz anime para casa' } },
  { path: 'catalogo', component: CatalogPageComponent, data: { title: 'Catálogo · LUMIKO' } },
  { path: 'producto/:id', component: ProductPageComponent, data: { title: 'Producto · LUMIKO' } },
  { path: 'carrito', component: CartPageComponent, data: { title: 'Tu carrito · LUMIKO' } },
  { path: 'checkout', component: CheckoutPageComponent, data: { title: 'Checkout · LUMIKO' } },
  { path: 'pedido', component: OrderPageComponent, data: { title: 'Confirmación de pedido · LUMIKO' } },
  { path: '404', component: NotFoundComponent, data: { title: 'No encontrado · LUMIKO' } },
  { path: '**', component: NotFoundComponent, data: { title: 'No encontrado · LUMIKO' } }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'enabled',
      anchorScrolling: 'enabled',
      scrollOffset: [0, 96]
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
