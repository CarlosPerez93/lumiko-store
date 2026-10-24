import { animate, style, transition, trigger } from '@angular/animations';

const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
const EASE_IN = 'cubic-bezier(0.7, 0, 0.84, 0)';

/** Drawer lateral del carrito */
export const drawerAnimation = trigger('drawer', [
  transition(':enter', [
    style({ transform: 'translateX(102%)' }),
    animate(`520ms ${EASE_OUT}`, style({ transform: 'translateX(0)' }))
  ]),
  transition(':leave', [animate(`320ms ${EASE_IN}`, style({ transform: 'translateX(102%)' }))])
]);

/** Fondo oscuro con desenfoque */
export const backdropAnimation = trigger('backdrop', [
  transition(':enter', [style({ opacity: 0 }), animate(`320ms ${EASE_OUT}`, style({ opacity: 1 }))]),
  transition(':leave', [animate(`260ms ${EASE_IN}`, style({ opacity: 0 }))])
]);

/** Modal de ficha de producto */
export const modalAnimation = trigger('modal', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(26px) scale(0.96)' }),
    animate(`480ms ${EASE_OUT}`, style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
  ]),
  transition(':leave', [
    animate(`240ms ${EASE_IN}`, style({ opacity: 0, transform: 'translateY(14px) scale(0.98)' }))
  ])
]);

/** Aparición de toasts y elementos pequeños */
export const popAnimation = trigger('pop', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(18px) scale(0.94)' }),
    animate(`380ms ${EASE_OUT}`, style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
  ]),
  transition(':leave', [animate(`220ms ${EASE_IN}`, style({ opacity: 0, transform: 'scale(0.96)' }))])
]);

/** Apertura de acordeón FAQ */
export const accordionAnimation = trigger('accordion', [
  transition(':enter', [
    style({ height: 0, opacity: 0 }),
    animate(`340ms ${EASE_OUT}`, style({ height: '*', opacity: 1 }))
  ]),
  transition(':leave', [animate(`220ms ${EASE_IN}`, style({ height: 0, opacity: 0 }))])
]);

/** Cambio de lista al filtrar productos */
export const gridAnimation = trigger('grid', [
  transition('* => *', [
    style({ opacity: 0, transform: 'translateY(18px)' }),
    animate(`420ms ${EASE_OUT}`, style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);
