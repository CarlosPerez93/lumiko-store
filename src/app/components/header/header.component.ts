import { Component, HostListener } from '@angular/core';
import { CartService } from '../../core/cart.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  scrolled = false;
  menuOpen = false;

  readonly links = [
    { label: 'Catálogo', href: '#catalogo' },
    { label: 'Experiencia', href: '#experiencia' },
    { label: 'Opiniones', href: '#opiniones' },
    { label: 'FAQ', href: '#faq' }
  ];

  constructor(public cart: CartService) {}

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
