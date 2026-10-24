import { LOCALE_ID, NgModule } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { HeroComponent } from './components/hero/hero.component';
import { CatalogComponent } from './components/catalog/catalog.component';
import { ProductCardComponent } from './components/product-card/product-card.component';
import { ProductDetailComponent } from './components/product-detail/product-detail.component';
import { CartDrawerComponent } from './components/cart-drawer/cart-drawer.component';
import { ExperienceComponent } from './components/experience/experience.component';
import { SocialComponent } from './components/social/social.component';
import { FooterComponent } from './components/footer/footer.component';
import { ToastComponent } from './components/toast/toast.component';
import { RevealDirective } from './shared/reveal.directive';

registerLocaleData(localeEs, 'es-ES');

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    HeroComponent,
    CatalogComponent,
    ProductCardComponent,
    ProductDetailComponent,
    CartDrawerComponent,
    ExperienceComponent,
    SocialComponent,
    FooterComponent,
    ToastComponent,
    RevealDirective
  ],
  imports: [BrowserModule, BrowserAnimationsModule, FormsModule],
  providers: [{ provide: LOCALE_ID, useValue: 'es-ES' }],
  bootstrap: [AppComponent]
})
export class AppModule {}
