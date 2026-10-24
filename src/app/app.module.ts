import { LOCALE_ID, NgModule } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { HeaderComponent } from './components/header/header.component';
import { HeroComponent } from './components/hero/hero.component';
import { CatalogComponent } from './components/catalog/catalog.component';
import { ProductCardComponent } from './components/product-card/product-card.component';
import { CartDrawerComponent } from './components/cart-drawer/cart-drawer.component';
import { ExperienceComponent } from './components/experience/experience.component';
import { SocialComponent } from './components/social/social.component';
import { FooterComponent } from './components/footer/footer.component';
import { ToastComponent } from './components/toast/toast.component';
import { RevealDirective } from './shared/reveal.directive';

import { HomeComponent } from './pages/home/home.component';
import { CatalogPageComponent } from './pages/catalog/catalog-page.component';
import { ProductPageComponent } from './pages/product/product-page.component';
import { CartPageComponent } from './pages/cart/cart-page.component';
import { CheckoutPageComponent } from './pages/checkout/checkout-page.component';
import { OrderPageComponent } from './pages/order/order-page.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';

import { CATALOG_SOURCES } from './core/catalog/product-source';
import { AlibabaProductSource } from './core/catalog/alibaba/alibaba.source';

registerLocaleData(localeEs, 'es-ES');

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    HeroComponent,
    CatalogComponent,
    ProductCardComponent,
    CartDrawerComponent,
    ExperienceComponent,
    SocialComponent,
    FooterComponent,
    ToastComponent,
    RevealDirective,
    HomeComponent,
    CatalogPageComponent,
    ProductPageComponent,
    CartPageComponent,
    CheckoutPageComponent,
    OrderPageComponent,
    NotFoundComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'es-ES' },
    // Registro de proveedores del catálogo: para añadir uno nuevo basta con
    // implementar ProductSourceAdapter y añadirlo a esta lista.
    // multi:true agrega UN adaptador por línea y Angular los entrega como array.
    { provide: CATALOG_SOURCES, useValue: new AlibabaProductSource(), multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
