import { Component } from '@angular/core';
import { ToastService } from '../../core/toast.service';
import { accordionAnimation } from '../../shared/animations';

@Component({
  selector: 'app-social',
  templateUrl: './social.component.html',
  animations: [accordionAnimation]
})
export class SocialComponent {
  readonly testimonials = [
    {
      name: 'Marta Ruiz',
      city: 'Valencia',
      initials: 'MR',
      quote:
        'La lámpara Tsukuyomi fue el regalo estrella de cumpleaños. Mi hija la pone en modo sakura todas las noches y ya no hay peleas para apagar la luz.',
      product: 'Lámpara Tsukuyomi',
      rating: 5
    },
    {
      name: 'Iván Delgado',
      city: 'Bilbao',
      initials: 'ID',
      quote:
        'Tengo el proyector y el panel pixel en el despacho. La app va finísima y el modo música es una locura cuando hay visitas.',
      product: 'Proyector Nebula + Panel Pixel',
      rating: 5
    },
    {
      name: 'Laura y Nico',
      city: 'Sevilla',
      initials: 'LN',
      quote:
        'El robot Mochi le cuenta cuentos a nuestro hijo con la luz bajita. Es lo único que ha conseguido que se duerma sin mirar pantallas.',
      product: 'Robot Mochi',
      rating: 5
    }
  ];

  readonly faqs = [
    {
      q: '¿Hace falta un hub o una suscripción?',
      a: 'No. Todos los dispositivos se conectan directamente por Wi-Fi 2,4 GHz y se controlan con la app gratuita. No hay cuotas mensuales ni caja central obligatoria.'
    },
    {
      q: '¿Son seguras para niños pequeños?',
      a: 'Sí. Usamos materiales sin BPA, difusores fríos al tacto y fuentes de alimentación certificadas. El Cubo Lumen está indicado desde los 0 años y el resto desde los 5-6 años según modelo.'
    },
    {
      q: '¿Cuánto tarda el envío?',
      a: '24/48 h en península con seguimiento. Baleares y Canarias entre 3 y 5 días laborables. Envío gratuito a partir de 49 €.'
    },
    {
      q: '¿Puedo devolverlo si no me convence?',
      a: 'Tienes 30 días desde la recepción, sin justificar el motivo y con recogida gratuita en península. La garantía oficial es de 2 años.'
    },
    {
      q: '¿Funciona sin Wi-Fi?',
      a: 'Sí. Todos los modelos mantienen control táctil o por mando aunque se caiga la red, y guardan la última escena configurada.'
    }
  ];

  openFaq: number | null = 0;

  email = '';
  subscribed = false;
  newsletterError = '';

  constructor(private toast: ToastService) {}

  toggleFaq(index: number): void {
    this.openFaq = this.openFaq === index ? null : index;
  }

  subscribe(): void {
    const valid = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(this.email.trim());
    if (!valid) {
      this.newsletterError = 'Introduce un correo electrónico válido.';
      return;
    }
    this.newsletterError = '';
    this.subscribed = true;
    this.toast.show('¡Bienvenido al club LUMIKO! Revisa tu correo.');
    this.email = '';
  }

  stars(count: number): number[] {
    return Array(count).fill(0);
  }
}
