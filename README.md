# LUMIKO · Smart Play

Tienda online de **juguetes domotizados y lámparas inteligentes de anime** para niños y adultos.
Proyecto real y funcional: catálogo con filtros, vista rápida, carrito persistente, cupones y checkout de demostración.

![stack](https://img.shields.io/badge/Angular-12.2.17-DD0031) ![stack](https://img.shields.io/badge/Tailwind-3.4-38BDF8) ![stack](https://img.shields.io/badge/TypeScript-4.3-3178C6)

---

## 1. Arrancar la tienda

```bash
cd lumiko-store
npm install       # ya está instalado en este equipo
npm start         # http://localhost:4200
```

Build de producción:

```bash
npm run build     # genera dist/lumiko
```

> El proyecto ya incluye un `.npmrc` con dos ajustes necesarios:
> - `node-options=--openssl-legacy-provider`, porque Angular 12 usa webpack 5.52 (hash md4) y Node 17+ exige el proveedor legacy de OpenSSL.
> - `legacy-peer-deps=true`, porque Angular 12 declara `tailwindcss@^2` como peer opcional y aquí usamos Tailwind 3.
>
> Si trabajas con Node 16 no necesitas el primer ajuste.

## 2. Stack

| Capa | Tecnología | Por qué |
|---|---|---|
| Framework | Angular 12.2.17 (NgModules) | versión pedida, arquitectura clásica con módulos |
| Estilos | Tailwind CSS 3.4 + `@layer` propio | sistema de diseño con tokens, sin CSS muerto |
| Animaciones | `@angular/animations` + CSS keyframes + IntersectionObserver | ver sección 5 |
| Estado | RxJS `BehaviorSubject` + `combineLatest` | carrito único, sin librería extra |
| Tipografía | Sora (display) + Inter (texto) | Google Fonts, precargadas |
| Imágenes | Set generado a medida (1 hero + 8 productos) | estudio oscuro coherente, formato PNG |

## 3. Estructura

```
src/
├─ app/
│  ├─ core/                 # dominio y estado
│  │  ├─ product.model.ts   # tipos + categorías
│  │  ├─ products.data.ts   # catálogo editable (8 productos)
│  │  ├─ cart.service.ts    # carrito, cupones, envío, persistencia
│  │  └─ toast.service.ts   # notificaciones
│  ├─ shared/
│  │  ├─ animations.ts      # triggers reutilizables
│  │  └─ reveal.directive.ts# aparición al hacer scroll
│  ├─ components/
│  │  ├─ header/  hero/  catalog/  product-card/
│  │  ├─ product-detail/  cart-drawer/
│  │  └─ experience/  social/  footer/  toast/
│  └─ app.module.ts
├─ assets/img/              # hero + 8 fotos de producto
├─ styles.css               # tokens, componentes y utilidades
└─ tailwind.config.js       # paleta neón, fuentes, keyframes
```

## 4. Qué hace la tienda

- **Catálogo** de 8 productos (lámparas, robots, proyección, gaming) con filtro por categoría, contador por píldora y ordenación (más vendidos, precio, novedades, valoración).
- **Vista rápida** en modal: galería, acabados, quantity stepper, especificaciones, garantía y añadir al carrito.
- **Carrito lateral** con cantidades, eliminación, barra de progreso hacia el envío gratis (49 €), cupones `LUMI10` (-10 %) y `ANIME15` (-15 %), y resumen de totales.
- **Persistencia** del carrito en `localStorage` (`lumiko.cart.v1`), validando productos y acabados al recuperar.
- **Checkout de demostración**: no hay pasarela de pago conectada; muestra un aviso al confirmar.
- **Wishlist** local por producto, newsletter con validación por expresión regular, FAQ en acordeón, toast de confirmación.
- **Accesibilidad**: foco visible, `aria-label`/`aria-expanded` en controles, cierre con `Escape`, bloqueo de scroll del documento con overlays abiertos y soporte de `prefers-reduced-motion`.

## 5. Animaciones (cómo están hechas)

| Efecto | Implementación |
|---|---|
| Aurora de fondo, grid, blobs | CSS keyframes `aurora`, `floatSoft`, `spinSlow` |
| Marquesina de beneficios | `.marquee-track` con `animation: marquee` y pausa al hover |
| Aparición por scroll | `appReveal` (IntersectionObserver) + clases `.reveal` / `is-visible`, con retardo por `--reveal-delay` |
| Drawer del carrito | trigger `drawerAnimation` (`transform` + easing `cubic-bezier(.16,1,.3,1)`) |
| Backdrop | `backdropAnimation` (fade) |
| Modal de producto | `modalAnimation` (scale + translate + fade) |
| Badge del carrito | `popAnimation` al cambiar la cantidad |
| Acordeón FAQ | `accordionAnimation` (height + opacity) |
| Rejilla del catálogo | `gridAnimation` al cambiar de filtro |
| Botones y tarjetas | barrido de brillo en `.btn-primary::after`, elevación y glow en hover |

Todo el movimiento se desactiva con `@media (prefers-reduced-motion: reduce)`.

## 6. Personalizar

- **Productos, precios y stock**: `src/app/core/products.data.ts`.
- **Colores, fuentes y keyframes**: `src/tailwind.config.js`.
- **Cupones y umbral de envío gratis**: constantes `COUPONS`, `FREE_SHIPPING` y `SHIPPING_COST` en `cart.service.ts`.
- **Copy de secciones**: cada componente tiene su `.html` en `src/app/components/<seccion>/`.

## 7. Verificación

- `npm run build` compila en producción: 481 kB (ES2017) iniciales, sin errores ni warnings de presupuesto.
- Revisión visual automatizada en 1440×900 y 390×844: 0 errores de consola, 9/9 imágenes cargadas, sin desbordes horizontales y 20/20 bloques revelados tras el scroll.

---

© 2026 LUMIKO · Proyecto de demostración. Marcas, testimonios y datos de producto son ficticios; no se procesan pagos reales.
