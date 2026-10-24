import { Component } from '@angular/core';

interface FooterLink {
  label: string;
  path?: string;
  fragment?: string;
  queryParams?: { [key: string]: string };
  href?: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html'
})
export class FooterComponent {
  readonly year = new Date().getFullYear();

  readonly columns: FooterColumn[] = [
    {
      title: 'Tienda',
      links: [
        { label: 'Lámparas inteligentes', path: '/catalogo', queryParams: { categoria: 'lamparas' } },
        { label: 'Robots de compañía', path: '/catalogo', queryParams: { categoria: 'robots' } },
        { label: 'Proyección', path: '/catalogo', queryParams: { categoria: 'proyeccion' } },
        { label: 'Gaming & pixel', path: '/catalogo', queryParams: { categoria: 'gaming' } },
        { label: 'Catálogo completo', path: '/catalogo' }
      ]
    },
    {
      title: 'Ayuda',
      links: [
        { label: 'Envíos y entregas', path: '/', fragment: 'faq' },
        { label: 'Devoluciones', path: '/', fragment: 'faq' },
        { label: 'Cómo funciona', path: '/', fragment: 'experiencia' },
        { label: 'Proveedores', path: '/', fragment: 'proveedores' },
        { label: 'Contacto', href: 'mailto:hola@lumiko.store' }
      ]
    },
    {
      title: 'LUMIKO',
      links: [
        { label: 'Catálogo', path: '/catalogo' },
        { label: 'Mi carrito', path: '/carrito' },
        { label: 'Prensa', href: 'mailto:prensa@lumiko.store' },
        { label: 'Trabaja con nosotros', href: 'mailto:talento@lumiko.store' }
      ]
    }
  ];

  readonly payments = ['Visa', 'Mastercard', 'American Express', 'Apple Pay', 'Google Pay'];
}
