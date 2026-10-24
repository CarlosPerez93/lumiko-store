import { Component } from '@angular/core';
import { CatalogService, COUNTRY_LABEL } from '../../core/catalog/catalog.service';
import { BUSINESS_TYPE_LABEL } from '../../core/product.model';
import { ToastService } from '../../core/toast.service';
import { accordionAnimation } from '../../shared/animations';

interface SupplierHighlight {
  id: string;
  name: string;
  originLabel: string;
  businessTypeLabel: string;
  verified: boolean;
  rating: number;
  yearsActive: number;
  deliveryRate: number;
  sold180: number;
  products: number;
}

@Component({
  selector: 'app-social',
  templateUrl: './social.component.html',
  animations: [accordionAnimation]
})
export class SocialComponent {
  readonly couponCode = 'LUMI10';

  readonly faqs = [
    {
      q: '¿De dónde salen los productos del catálogo?',
      a: 'De las fichas públicas de proveedores de Alibaba.com. Cada referencia se guarda como una instantánea con fecha dentro del repositorio, así que el precio, el MOQ y el enlace que ves son auditables y reproducibles. En la ficha de cada producto tienes el enlace directo a la publicación original del fabricante.'
    },
    {
      q: '¿El precio que veo es el precio del proveedor?',
      a: 'No. El precio grande es el precio de venta de LUMIKO, con IVA incluido. Justo debajo mostramos, por transparencia, el coste de referencia del proveedor y su unidad de venta (por ejemplo, por pieza o por conjunto) y el MOQ que exige.'
    },
    {
      q: '¿Qué significa el MOQ que aparece en la ficha?',
      a: 'Es la cantidad mínima que el fabricante vende a un distribuidor. La tienda vende por unidades sueltas; el MOQ se muestra como dato de trazabilidad del origen. Si necesitas una cantidad grande, escríbenos y lo revisamos.'
    },
    {
      q: '¿Cómo se procesa el pago?',
      a: 'Con Stripe Checkout sobre TLS. Los datos de tu tarjeta se introducen en el dominio de Stripe: LUMIKO no los recibe ni los almacena. El importe se recalcula en el servidor antes de crear la sesión de pago, y el pedido se marca como pagado cuando Stripe confirma la firma del webhook.'
    },
    {
      q: '¿Cuánto tarda el envío?',
      a: 'Depende del proveedor y del destino. En cada ficha mostramos el plazo de entrega que publica el fabricante y su tasa de entrega. Al confirmar el pedido te enviamos por email el plazo concreto antes de fabricar.'
    },
    {
      q: '¿Puedo devolverlo?',
      a: 'Sí, tienes 14 días desde la recepción del pedido para devolverlo en su embalaje original. Escríbenos con la referencia del pedido y te indicamos cómo enviarlo.'
    }
  ];

  openFaq: number | null = 0;

  constructor(private catalog: CatalogService, private toast: ToastService) {}

  get suppliers(): SupplierHighlight[] {
    const byId: { [id: string]: SupplierHighlight } = {};

    this.catalog.all().forEach((product) => {
      const supplier = product.supplier;
      const existing = byId[supplier.id];
      if (existing) {
        existing.products += 1;
        return;
      }
      byId[supplier.id] = {
        id: supplier.id,
        name: supplier.name,
        originLabel: COUNTRY_LABEL[supplier.country] || supplier.country || 'Origen no indicado',
        businessTypeLabel: BUSINESS_TYPE_LABEL[supplier.businessType] || 'Proveedor',
        verified: supplier.verified,
        rating: supplier.rating,
        yearsActive: supplier.yearsActive,
        deliveryRate: supplier.deliveryRate,
        sold180: supplier.sold180,
        products: 1
      };
    });

    return Object.keys(byId)
      .map((key) => byId[key])
      .sort(
        (a, b) =>
          Number(b.verified) - Number(a.verified) ||
          b.rating - a.rating ||
          b.sold180 - a.sold180
      )
      .slice(0, 3);
  }

  get verifiedShare(): number {
    const stats = this.catalog.stats();
    return stats.suppliers ? Math.round((stats.verified / stats.suppliers) * 100) : 0;
  }

  toggleFaq(index: number): void {
    this.openFaq = this.openFaq === index ? null : index;
  }

  copyCoupon(): void {
    const nav = navigator as Navigator & { clipboard?: Clipboard };
    if (nav.clipboard && nav.clipboard.writeText) {
      nav.clipboard.writeText(this.couponCode).then(
        () => this.toast.show(`Código ${this.couponCode} copiado`),
        () => this.toast.show(`Tu código es ${this.couponCode}`, 'info')
      );
      return;
    }
    this.toast.show(`Tu código es ${this.couponCode}`, 'info');
  }

  stars(count: number): number[] {
    return Array(Math.max(0, Math.round(count))).fill(0);
  }
}
