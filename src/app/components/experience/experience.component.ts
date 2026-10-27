import { Component } from '@angular/core';
import { CatalogService } from '../../core/catalog/catalog.service';

@Component({
  selector: 'app-experience',
  templateUrl: './experience.component.html'
})
export class ExperienceComponent {
  readonly steps = [
    {
      title: 'Diseño e Innovación',
      text: 'Lámparas inteligentes y robots con tecnología LED conectada, sincronización musical y control total desde tu móvil.',
      icon: 'search'
    },
    {
      title: 'Calidad Certificada',
      text: 'Cada producto pasa rigurosos controles de seguridad eléctrica y durabilidad europea con 3 años de garantía oficial.',
      icon: 'tag'
    },
    {
      title: 'Pago 100% Seguro',
      text: 'El checkout se procesa en Stripe Checkout con encriptación bancaria TLS de 256 bits. Aceptamos tarjetas, Apple Pay y Google Pay.',
      icon: 'lock'
    },
    {
      title: 'Envío Express y Seguimiento',
      text: 'Despacho rápido con número de tracking directo a tu email para que sigas tu paquete paso a paso hasta tu puerta.',
      icon: 'check'
    }
  ];

  readonly shippingPoints = [
    { title: 'Envío gratis desde 49 €', text: 'Por debajo, 4,95 € de envío en península.' },
    { title: 'Devolución en 14 días', text: 'Desde la recepción del pedido, en su embalaje original.' },
    { title: 'Soporte con personas', text: 'Escríbenos con la referencia del pedido y te respondemos por email.' }
  ];

  constructor(private catalog: CatalogService) {}

  get stats() {
    return this.catalog.stats();
  }

  get sources() {
    return this.catalog.sources();
  }
}
