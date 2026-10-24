import { Component } from '@angular/core';
import { PRODUCTS } from '../../core/products.data';
import { CartService } from '../../core/cart.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-experience',
  templateUrl: './experience.component.html'
})
export class ExperienceComponent {
  readonly features = [
    {
      title: 'Se enciende con la voz',
      text: 'Compatible con Alexa, Google Home y HomeKit. «Oye, pon la luz sakura» y listo.',
      icon: 'voice'
    },
    {
      title: 'Rutinas de sueño reales',
      text: 'Amanecer progresivo, atenuación al 1 % y apagado automático sin pantallas en la habitación.',
      icon: 'moon'
    },
    {
      title: 'Seguro para peques',
      text: 'Bordes fríos, materiales sin BPA y caídas de hasta 1,2 m probadas en laboratorio.',
      icon: 'shield'
    },
    {
      title: 'Mejora con el tiempo',
      text: 'Escenas y funciones nuevas cada mes mediante actualización OTA, sin coste extra.',
      icon: 'spark'
    }
  ];

  readonly appPoints = [
    { title: 'Escenas en un toque', text: 'Matsuri, Sakura, Neón o Luna: cambia el ambiente de la habitación en menos de un segundo.' },
    { title: 'Sincroniza con la música', text: 'Las luces siguen el ritmo de lo que suena en casa, sin cables ni micrófonos externos.' },
    { title: 'Programa sin pensar', text: 'Rutina de despertar, deberes y cuentos con luz cálida. Todo desde el móvil.' }
  ];

  readonly pack = {
    items: [PRODUCTS[0], PRODUCTS[4]],
    price: 129,
    oldPrice: 149.8
  };

  constructor(private cart: CartService, private toast: ToastService) {}

  addPack(): void {
    this.pack.items.forEach((product) => this.cart.add(product, product.colors[0].name, 1));
    this.toast.show('Pack Dúo Luminoso añadido al carrito');
    this.cart.openDrawer();
  }
}
