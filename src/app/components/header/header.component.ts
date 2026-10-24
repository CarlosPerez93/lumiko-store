import { Component, HostListener } from '@angular/core';
import { CartService } from '../../core/cart.service';
import { CatalogService } from '../../core/catalog/catalog.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  scrolled = false;
  menuOpen = false;

  readonly links = [
    { label: 'Inicio', path: '/' },
    { label: 'Catálogo', path: '/catalogo' },
    { label: 'Cómo funciona', path: '/', fragment: 'experiencia' },
    { label: 'Opiniones', path: '/', fragment: 'opiniones' },
    { label: 'FAQ', path: '/', fragment: 'faq' }
  ];

  constructor(public cart: CartService, private catalog: CatalogService) {}

  get stats() {
    return this.catalog.stats();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled = typeof window !== 'undefined' && window.scrollY > 24;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.menuOpen = false;
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  openCart(): void {
    this.closeMenu();
    this.cart.openDrawer();
  }
}
