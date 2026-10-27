# LUMIKO · Smart Play

Tienda online de **juguetes domotizados y lámparas inteligentes de anime** para niños y adultos.
Angular 12 + Tailwind 3, catálogo multiproveedor con **36 productos reales de dos proveedores** (Alibaba.com y ABYstyle), carrito persistente, cupones, checkout con **Stripe Checkout** y página de confirmación de pedido con estados de pago reales.

![stack](https://img.shields.io/badge/Angular-12.2.17-DD0031) ![stack](https://img.shields.io/badge/Tailwind-3.4-38BDF8) ![stack](https://img.shields.io/badge/TypeScript-4.3-3178C6) ![stack](https://img.shields.io/badge/Stripe-Checkout-635BFF) ![stack](https://img.shields.io/badge/Netlify-Functions-00C7B7)

---

## 0. Estado de producción (24 oct 2026)

| Comprobación | Resultado |
|---|---|
| Sitio | https://lumiko-store.netlify.app (deploy `6adcc00209f098169532574f`) |
| Arnés `node tools/verify-production.js` | **34/34 correctas, 0 fallos** |
| Rutas SPA (`/`, `/catalogo`, `/carrito`, `/checkout`, `/pedido`, `/producto/:id`, 404) | todas 200, router sirviendo la app |
| Responsive a 375×812 (`/carrito` vacío y lleno, `/checkout`, `/pedido`, `/404`, `/catalogo`) | `scrollWidth` = `clientWidth` en todas: **sin overflow horizontal** |
| Cabeceras de seguridad, Functions, validaciones y metadatos | correctas |
| Cobro real | **pendiente de claves de Stripe**: hoy el checkout responde `503 payments_not_configured` con un mensaje de negocio, sin filtrar detalles internos |

Los dos únicos puntos abiertos del mandato son los que dependen de credenciales
externas: `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (sección 6) para cerrar el
pago real, y el dominio propio (sección 11), que el mandato deja como «si corresponde».

---

## 1. Arrancar en local

```bash
npm install                 # dependencias
npm run catalog:export      # snapshot del catálogo para las Functions
npm start                   # http://localhost:4200
```

Para probar también las Netlify Functions (pagos) en local:

```bash
npx netlify dev             # http://localhost:8888, redirige Functions y SPA
```

Build de producción:

```bash
npm run build               # prebuild exporta el catálogo y compila en dist/lumiko
npm run verify:backend      # 46 comprobaciones de reglas comerciales, despacho y redes
```

> El proyecto incluye un `.npmrc` con dos ajustes necesarios:
> - `node-options=--openssl-legacy-provider`, porque Angular 12 usa webpack 5.52 (hash md4) y Node 17+ exige el proveedor legacy de OpenSSL.
> - `legacy-peer-deps=true`, porque Angular 12 declara `tailwindcss@^2` como peer opcional y aquí usamos Tailwind 3.
>
> La línea `"wmic.exe" no se reconoce…` que aparece en cada build es ruido del CLI en Windows: no afecta al resultado.

## 2. Stack

| Capa | Tecnología | Por qué |
|---|---|---|
| Framework | Angular 12.2.17 (NgModules) | versión pedida, arquitectura clásica con módulos |
| Estilos | Tailwind CSS 3.4 + `@layer` propio | sistema de diseño con tokens, sin CSS muerto |
| Animaciones | `@angular/animations` + CSS keyframes + IntersectionObserver | ver sección 6 |
| Estado | RxJS `BehaviorSubject` + `combineLatest` | carrito único, sin librería extra |
| Catálogo | Adaptadores de proveedor + `InjectionToken` multi | crece sin tocar componentes (sección 4) |
| Pagos | Stripe Checkout + Netlify Functions | el importe se recalcula en servidor |
| Despliegue | Netlify (build, Functions, contextos) | un solo proveedor para SPA y backend |

## 3. Rutas

| Ruta | Página | Notas |
|---|---|---|
| `/` | Inicio | hero, destacados, experiencia, FAQ |
| `/catalogo` | Catálogo | filtros por categoría, búsqueda y ordenación |
| `/producto/:id` | Detalle | galería, especificaciones, disponibilidad, proveedor de origen |
| `/carrito` | Carrito | cantidades, cupones, envío gratis desde 49 € |
| `/checkout` | Checkout | formulario validado + redirección a Stripe |
| `/pedido` | Confirmación | estados `paid` / `unpaid` / `processing`, sondeo automático |
| `/404` y `**` | No encontrado | manejo de rutas inexistentes |

Las rutas usan `scrollPositionRestoration` y `anchorScrolling`; los títulos por ruta están en `data.title`.
**No hay autenticación**: el mandato la pedía «si es necesaria» y no lo es para comprar como invitado (Stripe recoge el correo y la dirección). Ver «próximos pasos».

## 4. Arquitectura del catálogo (crecer sin rehacer la app)

```
SupplierProduct            forma cruda del proveedor (precio, MOQ, imágenes, proveedor…)
      │
ProductSourceAdapter       { meta, load(): Observable<SupplierProduct[]> }
      │
CATALOG_SOURCES (token)    registro multi: un adaptador por proveedor
      │
CatalogService             normaliza a Product, deduplica, filtra y calcula estadísticas
```

**Añadir un proveedor = 2 pasos:**

1. Crear `src/app/core/catalog/mi-proveedor/mi-proveedor.source.ts` implementando `ProductSourceAdapter`.
2. Añadir una línea en `app.module.ts`:

```ts
{ provide: CATALOG_SOURCES, useValue: new MiProveedorSource(), multi: true }
```

Nada más: `CatalogService` aplana los proveedores registrados y la UI no cambia. Si un adaptador falla, el catálogo sigue funcionando con los demás.

**Precio de venta:** no viene del proveedor. `src/app/core/catalog/pricing.ts` aplica la política de LUMIKO (`margen 2,6`, mínimo 12,90 €, redondeo a 0,10 €) sobre el coste mayorista. Cambiar la política recalcula todo el catálogo.

Cada fuente puede declarar **su propia política** con `meta.pricingPolicy`, porque no todos los proveedores publican precio mayorista: un marketplace publica coste de fábrica, un distribuidor europeo publica PVP. Si el campo falta, se usa `PRICING_POLICY`. El backend aplica exactamente la misma política en `tools/export-catalog.js`, así que el precio que se ve y el que se cobra no pueden divergir.

## 5. Proveedores integrados

| Proveedor | Adaptador | Productos | Política | Datos |
|---|---|---|---|---|
| Alibaba.com (marketplace, CN) | `core/catalog/alibaba/alibaba.source.ts` | 24 | `PRICING_POLICY` (margen 2,6) | precio mayorista, MOQ, imágenes, valoraciones, proveedor verificado, país y URL de origen |
| ABYstyle · Abysse Corp (distribuidor, FR) | `core/catalog/abystyle/abystyle.source.ts` | 12 | `RETAIL_PURCHASE_POLICY` (margen 1,3 ≈ 23 % bruto) | PVP publicado en EUR, imágenes de la ficha, plazos, referencia del fabricante y URL de origen |

- **Alibaba.com**: datos en bruto en `tools/data/batch-a.json` y `tools/data/batch-b.json`; `tools/generate-catalog.js` los normaliza a `src/app/core/catalog/data/alibaba.products.ts`.
- **ABYstyle**: `src/app/core/catalog/data/abystyle.products.ts` es un snapshot **curado a mano** (no generado) desde `https://www.abystyle.com` el 24 oct 2026: 12 lámparas de licencia (One Piece, Naruto, Death Note, Dragon Ball, Harry Potter, Disney), con imagen y ficha reales verificadas. Sus métricas de marketplace (`sold180`, `deliveryRate`, `yearsActive`) no se inventan: se dejan a 0 y la UI las oculta.

`tools/export-catalog.js` recorre **todas** las fuentes registradas y genera el snapshot en céntimos que consume el backend (`netlify/functions/_lib/catalog.json`, no versionado). El snapshot declara un bloque `sources[]` con el recuento y la política de cada proveedor; `npm run verify:backend` comprueba que la suma cuadra con el total.

> Si algún día se abre una cuenta profesional en Abysse Corp (`trade.abyssecorp.com`), el precio pasa a ser mayorista: basta con quitar `pricingPolicy: RETAIL_PURCHASE_POLICY` de `ABYSTYLE_SOURCE_META` para que herede `PRICING_POLICY`. No hay que tocar tienda ni backend.

Cada ficha muestra el proveedor de origen y enlaza a su página real; el precio de venta es el de LUMIKO.

## 6. Pagos (Stripe Checkout)

```
Navegador                 Netlify Function                Stripe
   │  POST items+customer ─────► create-checkout-session
   │                             ├─ recalcula el pedido (céntimos)
   │                             ├─ crea/reutiliza cupón
   │                             └─ crea Checkout Session ─────► sesión
   │  ◄──────────── { id, url } ─┘
   │  redirección a Stripe ──────────────────────────────────► pago
   │                                                              │
   │                                                    webhook (firmado)
   │                             stripe-webhook ◄──────────────────┘
   │                             └─ anota lumiko_status en la sesión
   │  GET /pedido?session_id=… ─► get-order ─► estado real del pago
```

- **El importe nunca lo fija el navegador**: `create-checkout-session` resuelve cada `id` contra el snapshot del catálogo y recalcula subtotal, descuento y envío en céntimos.
- **Sin base de datos**: la sesión de Stripe es el registro del pedido; el webhook añade `lumiko_status`, `lumiko_event` y `lumiko_updated_at` a su metadata.
- **Cupones**: Stripe no admite descuentos ad-hoc, así que se crea un cupón con id determinista `LUMIKO_<CODIGO>` (`duration: once`).
- **Seguridad**: la firma se verifica con `stripe.webhooks.constructEvent`; una firma inválida devuelve `400 invalid_signature` y no se procesa nada. Los secretos solo viven en variables de entorno.
- **Estados**: `checkout.session.completed` y `async_payment_succeeded` → confirmado; `async_payment_failed` → fallido; `expired` → expirado.

### Variables de entorno

Se definen en Netlify (Site settings → Environment variables) o en un `.env` local para `netlify dev`. Plantilla en `.env.example`; **nunca** se versionan valores reales.

| Variable | Obligatoria | Uso |
|---|---|---|
| `STRIPE_SECRET_KEY` | sí | clave secreta de Stripe (test o live). Sin ella el checkout responde `503 payments_not_configured` |
| `STRIPE_WEBHOOK_SECRET` | sí | secreto de firma del endpoint `/.netlify/functions/stripe-webhook` |
| `FULFILLMENT_WEBHOOK_URL` | opcional | URL de webhook externo (Make, Zapier, n8n o ERP) para despachar automáticamente la compra al proveedor al cobrar |
| `SOCIAL_WEBHOOK_URL` | opcional | URL de webhook para despachar y auto-programar campañas de vídeo/imagen a redes (Make, Zapier, Metricool, Buffer) |
| `PUBLIC_SITE_URL` | recomendada | URL canónica para `success_url` / `cancel_url` |
| `LUMIKO_ENV` | automática | `production` / `preview` / `branch`, fijada en `netlify.toml` |

### Configurar el webhook en Stripe

1. Stripe Dashboard → Developers → Webhooks → *Add endpoint*.
2. URL: `https://<tu-sitio>.netlify.app/.netlify/functions/stripe-webhook`.
3. Eventos: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `payment_intent.payment_failed`.
4. Copiar el *signing secret* (`whsec_…`) a `STRIPE_WEBHOOK_SECRET` y volver a desplegar.

El recorrido completo —clic a clic, incluido el paso a modo live, la compra de prueba y
la verificación posterior— está en **[GUIA-STRIPE-Y-DOMINIO.md](GUIA-STRIPE-Y-DOMINIO.md)**.

## 7. Despliegue en Netlify

`netlify.toml` ya define todo:

```toml
[build]
  command = "npm run build"      # prebuild regenera el snapshot del catálogo
  publish = "dist/lumiko"
  functions = "netlify/functions"
```

- `NODE_VERSION=20` + `NODE_OPTIONS=--openssl-legacy-provider` para que Angular 12 compile en Netlify.
- Redirección SPA `/* → /index.html 200` (las Functions tienen prioridad).
- Cabeceras de seguridad (`nosniff`, `DENY`, `Referrer-Policy`, `Permissions-Policy`) y `Cache-Control: no-store` en las Functions.

El proyecto está **enlazado al repositorio Git**, así que el despliegue es continuo:

| Rama | Destino | URL |
|---|---|---|
| `main` | producción | https://lumiko-store.netlify.app |
| `dev` | deploy de previsualización | https://dev--lumiko-store.netlify.app |

Un `git push` a `main` dispara build y publicación; un push a `dev` genera una preview con
su propia URL y sus propias variables de contexto. El enlace está hecho sobre
`https://github.com/CarlosPerez93/lumiko-store` (repo privado): Netlify recibe los webhooks
de GitHub, no hay que desplegar nada a mano. Si se rompe la conexión, se rehace en
*Project configuration → Build & deploy → Link repository* o desde el plugin de GitHub
de Netlify, y los ajustes de `netlify.toml` se respetan igual.

```bash
git push origin dev     # preview
git push origin main    # producción
```

Si hiciera falta publicar sin pasar por Git (emergencia, sin tocar `main`):

```bash
npx netlify deploy --build --prod   # compila, sube dist/lumiko y las Functions
```

## 8. Flujo de trabajo Git

```
main        ●── baseline ──────────────────────────────● release (tag v1.0.1)
             \                                       /
dev           ●────────────● merge feat/storefront-v1
                            \                        /
feat/storefront-v1           ● chore → catalog → storefront → payments
```

- Ramas de trabajo por funcionalidad (`feat/…`), integración en `dev` con `merge --no-ff` y promoción a `main` solo tras verificar en producción.
- Commits atómicos en imperativo y con ámbito: `feat(catalog):`, `feat(payments):`, `chore(repo):`.
- Etiquetas: `v1.0.0` en el primer estado funcional desplegado y `v1.0.1` en las correcciones salidas de la verificación en producción.
- Detalle de cambios en [CHANGELOG.md](CHANGELOG.md).

## 9. Animaciones

| Efecto | Implementación |
|---|---|
| Aurora de fondo, grid, blobs | CSS keyframes `aurora`, `floatSoft`, `spinSlow` |
| Marquesina de beneficios | `.marquee-track` con `animation: marquee` y pausa al hover |
| Aparición por scroll | `appReveal` (IntersectionObserver) + clases `.reveal` / `is-visible`, retardo por `--reveal-delay` |
| Drawer del carrito | trigger `drawerAnimation` (`transform` + easing `cubic-bezier(.16,1,.3,1)`) |
| Modal de producto | `modalAnimation` (scale + translate + fade) |
| Badge del carrito | `popAnimation` al cambiar la cantidad |
| Acordeón FAQ | `accordionAnimation` (height + opacity) |
| Rejilla del catálogo | `gridAnimation` al cambiar de filtro |

Todo el movimiento se desactiva con `@media (prefers-reduced-motion: reduce)`.

## 10. Personalizar

- **Política de precios**: `src/app/core/catalog/pricing.ts`.
- **Productos de Alibaba.com**: `tools/data/*.json` + `npm run catalog:build` (no editar el `.ts` generado).
- **Productos de ABYstyle**: `src/app/core/catalog/data/abystyle.products.ts`, editado a mano.
- **Tercer proveedor**: ver sección 4 — un adaptador nuevo + una línea en `app.module.ts`.
- **Cupones y envío**: constantes `COUPONS`, `FREE_SHIPPING` y `SHIPPING_COST` en `src/app/core/cart.service.ts` — y su espejo en el snapshot (`tools/export-catalog.js`), que es el que manda en el cobro.
- **Colores, fuentes y keyframes**: `tailwind.config.js`.
- **Países de reparto**: `COUNTRY_CODES` / `ALLOWED_COUNTRIES` en `netlify/functions/_lib/commerce.js` y el array `countries` del checkout.

## 11. Próximos pasos

1. **Claves de Stripe** en Netlify y alta del webhook (sección 6) para activar cobros reales.
2. **Dominio propio** (`lumiko.shop` o similar) con DNS en Netlify y HTTPS automático.

Los dos primeros están detallados paso a paso en [GUIA-STRIPE-Y-DOMINIO.md](GUIA-STRIPE-Y-DOMINIO.md).
3. **Autenticación** solo si se quiere historial de pedidos: hoy el pedido se consulta por `session_id` y el correo de Stripe es la confirmación.
4. **Base de datos** (Netlify Blobs, Supabase o Postgres) cuando haga falta stock, panel de pedidos o facturas: hoy Stripe es el registro.
5. **Cuenta profesional con Abysse Corp** (`trade.abyssecorp.com`): pasaría de PVP a mayorista y el margen de esas 12 referencias subiría sin tocar código.
6. **Precios y stock automáticos**: sustituir el snapshot estático por una sincronización programada con el catálogo del proveedor.

---

© 2026 LUMIKO · Marcas y datos de producto pertenecen a sus proveedores; los precios de venta son la política comercial de LUMIKO.
