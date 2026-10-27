import { Component } from '@angular/core';
import { ToastService } from '../../core/toast.service';
import { accordionAnimation } from '../../shared/animations';

interface BrandPillar {
  icon: string;
  title: string;
  tagline: string;
  description: string;
  badge: string;
}

@Component({
  selector: 'app-social',
  templateUrl: './social.component.html',
  animations: [accordionAnimation]
})
export class SocialComponent {
  readonly couponCode = 'LUMI10';

  readonly pillars: BrandPillar[] = [
    {
      icon: 'sparkles',
      title: 'Luz Inteligente y Efectos 3D',
      tagline: '16 Millones de Colores RGBIC',
      description: 'Lámparas de ilusión óptica, figuras iluminadas y paneles LED de alta definición para crear atmósferas inmersivas en tu dormitorio o setup.',
      badge: 'Tecnología LED'
    },
    {
      icon: 'app',
      title: 'Control por App y Asistentes',
      tagline: 'Conectividad Bluetooth y WiFi',
      description: 'Personaliza paletas de color, crea animaciones pixel art, sincroniza la iluminación con tu música y programa horarios de encendido automático.',
      badge: 'Smart Home'
    },
    {
      icon: 'shield',
      title: 'Garantía Oficial de 3 Años',
      tagline: 'Soporte y Reemplazo Directo',
      description: 'Todos los productos LUMIKO cuentan con 3 años de garantía oficial y 14 días de devolución sin compromiso con envío asegurado.',
      badge: 'Calidad 100%'
    }
  ];

  readonly faqs = [
    {
      q: '¿Qué tipo de productos ofrece LUMIKO?',
      a: 'LUMIKO está especializada en iluminación inteligente inspirada en anime, figuras de luz LED con efecto 3D, paneles Pixel Art programables, proyectores galácticos de nebulosa y robots interactivos de compañía.'
    },
    {
      q: '¿Cómo se controlan las lámparas y luces?',
      a: 'La mayoría de modelos se gestionan mediante app móvil gratuita (iOS y Android), mando a distancia por infrarrojos o controles táctiles integrados, permitiendo regular brillo, colores, efectos y sincronización con música.'
    },
    {
      q: '¿Cuánto tarda el envío y cuál es el coste?',
      a: 'El envío es gratuito para pedidos superiores a 49 €. Para importes inferiores, el coste es de 4,95 €. La entrega se realiza en 24-48 horas laborables con seguimiento en tiempo real vía email.'
    },
    {
      q: '¿Cómo se procesa el pago?',
      a: 'A través de Stripe Checkout con cifrado bancario TLS de 256 bits. Aceptamos tarjetas de crédito y débito (Visa, Mastercard, AMEX), Apple Pay y Google Pay. LUMIKO nunca almacena los datos de tu tarjeta.'
    },
    {
      q: '¿Tienen garantía los productos?',
      a: 'Sí, absolutamente todos los productos incluyen 3 años de garantía oficial ante cualquier fallo técnico o de componentes.'
    },
    {
      q: '¿Puedo devolver el producto si no me convence?',
      a: 'Sí, tienes 14 días naturales desde la recepción del paquete para solicitar una devolución sencilla en su embalaje original.'
    }
  ];

  openFaq: number | null = 0;

  constructor(private toast: ToastService) {}

  toggleFaq(index: number): void {
    this.openFaq = this.openFaq === index ? null : index;
  }

  copyCoupon(): void {
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(this.couponCode).catch(() => {});
    }
    this.toast.show(`Cupón ${this.couponCode} copiado al portapapeles`);
  }
}
