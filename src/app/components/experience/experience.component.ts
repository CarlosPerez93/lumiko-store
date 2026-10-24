import { Component } from '@angular/core';
import { CatalogService } from '../../core/catalog/catalog.service';

@Component({
  selector: 'app-experience',
  templateUrl: './experience.component.html'
})
export class ExperienceComponent {
  readonly steps = [
    {
      title: 'Elige sobre datos reales',
      text: 'Cada ficha muestra la imagen, el precio, el MOQ y el enlace públicos del proveedor que fabrica el producto. Sin catálogos inventados.',
      icon: 'search'
    },
    {
      title: 'Precio y origen a la vista',
      text: 'Verás el precio de venta LUMIKO junto al coste de referencia del proveedor, su país, su antigüedad y su valoración pública.',
      icon: 'tag'
    },
    {
      title: 'Paga con Stripe',
      text: 'El checkout se procesa en Stripe Checkout sobre TLS. LUMIKO nunca ve ni almacena los datos de tu tarjeta.',
      icon: 'lock'
    },
    {
      title: 'Confirmación verificada',
      text: 'El pedido se marca como pagado cuando Stripe confirma la firma del webhook, no cuando el navegador vuelve a la tienda.',
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
