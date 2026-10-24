import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html'
})
export class FooterComponent {
  readonly year = new Date().getFullYear();

  readonly columns = [
    {
      title: 'Tienda',
      links: [
        { label: 'Lámparas inteligentes', href: '#catalogo' },
        { label: 'Robots de compañía', href: '#catalogo' },
        { label: 'Proyección', href: '#catalogo' },
        { label: 'Gaming & pixel', href: '#catalogo' },
        { label: 'Packs y regalos', href: '#experiencia' }
      ]
    },
    {
      title: 'Ayuda',
      links: [
        { label: 'Envíos y entregas', href: '#faq' },
        { label: 'Devoluciones', href: '#faq' },
        { label: 'Garantía', href: '#faq' },
        { label: 'Compatibilidad', href: '#experiencia' },
        { label: 'Contacto', href: 'mailto:hola@lumiko.store' }
      ]
    },
    {
      title: 'LUMIKO',
      links: [
        { label: 'Sobre nosotros', href: '#experiencia' },
        { label: 'Opiniones', href: '#opiniones' },
        { label: 'Prensa', href: 'mailto:prensa@lumiko.store' },
        { label: 'Programa embajadores', href: '#experiencia' },
        { label: 'Trabaja con nosotros', href: 'mailto:talento@lumiko.store' }
      ]
    }
  ];

  readonly payments = ['Visa', 'Mastercard', 'PayPal', 'Bizum', 'Apple Pay'];
}
