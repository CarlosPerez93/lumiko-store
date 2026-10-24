# Changelog

Todos los cambios relevantes de LUMIKO se documentan en este fichero.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el versionado [SemVer](https://semver.org/lang/es/).

## [1.0.1] — 2026-10-24

Correcciones salidas de la verificación del sitio desplegado (navegación real a
375, 768 y 1440 px + arnés `tools/verify-production.js`).

### Corregido

- **Desbordamiento horizontal en móvil** en `/carrito`, `/checkout`, `/pedido` y
  `/404`: los degradados decorativos (`.aurora-a` mide 42 rem con `right:-10rem`)
  no estaban recortados por su sección, así que a 375 px el documento medía
  521 px y el resumen del carrito quedaba cortado. Las secciones ahora usan
  `overflow-hidden` y la línea del carrito pasa a imagen de 80 px con fila
  inferior que puede saltar.
- **Búsqueda insensible a acentos**: «lampara» devolvía 0 resultados y
  «lámpara» devolvía 7. `CatalogService.search()` pliega diacríticos
  (`NFD` + eliminación de `U+0300–U+036F`) y compara por palabras sobre nombre,
  claim, categoría, proveedor, público, características y especificaciones.
- **Selector de orden**: las `<option>` usaban `ngValue` dentro de un `ngModel`
  de tipo `string`, por lo que su `value` real era `"0: destacados"` /
  `"1: precio-asc"`. Se sustituye por `[value]` con el id.
- **Opacidades inexistentes**: `white/8`, `white/12`, `white/15` y `neon-*/15`
  no están en la escala de Tailwind y el compilador los descartaba en silencio
  (26 bordes, divisores y fondos sin pintar). Se convierten a la sintaxis
  arbitraria `white/[0.12]` y equivalentes.
- **Mensaje de pasarela no configurada**: el 503 `payments_not_configured`
  nombraba `STRIPE_SECRET_KEY` al comprador. Se mantiene el estado y el código,
  pero el texto pasa a ser una explicación de negocio.

### Añadido

- `tools/check-catalog-search.js`: comprueba la semántica de búsqueda (acentos y
  palabras) contra el snapshot real del catálogo.

## [1.0.0] — 2026-10-24

Primera versión funcional: catálogo real multiproveedor, compra completa y
pago con Stripe Checkout.

### Añadido

- **Catálogo multiproveedor** (`src/app/core/catalog/`): contrato
  `ProductSourceAdapter`, token `CATALOG_SOURCES` (`multi: true`) y
  `CatalogService` que normaliza, deduplica y agrega estadísticas. Añadir un
  proveedor son dos pasos y no toca ningún componente.
- **Proveedor Alibaba.com** (`alibaba/alibaba.source.ts`): 24 productos reales
  de juguetes domotizados, lámparas de anime y accesorios, con precio
  mayorista, MOQ, imágenes, valoraciones, proveedor verificado, país y URL de
  origen.
- **Política de precios** (`pricing.ts`): margen 2,6, mínimo 12,90 € y
  redondeo a 0,10 € sobre el coste mayorista. Cambiarla recalcula el catálogo.
- **Rutas**: `/`, `/catalogo`, `/producto/:id`, `/carrito`, `/checkout`,
  `/pedido`, `/404` y comodín `**`.
- **Carrito persistente** (`cart.service.ts`): `localStorage`
  (`lumiko.cart.v1`), cantidades de 1 a 10, envío gratis desde 49 €, coste de
  envío 4,95 € y cupones `LUMI10` (10 %) / `ANIME15` (15 %).
- **Pagos con Stripe Checkout**: `create-checkout-session` recalcula el pedido
  en céntimos desde el snapshot del catálogo, resuelve cupones como objetos
  `coupon` con id determinista `LUMIKO_<CODIGO>` y devuelve la URL de pago.
- **Webhook firmado** (`stripe-webhook.js`): verifica la firma con
  `stripe.webhooks.constructEvent` y anota `lumiko_status`, `lumiko_event` y
  `lumiko_updated_at` en la metadata de la sesión, que es el registro del
  pedido (sin base de datos).
- **Consulta de pedido** (`get-order.js`): estado real del pago a partir del
  `session_id`, con validación estricta del identificador.
- **Confirmación de pedido**: estados `paid` / `unpaid` / `processing` con
  sondeo automático.
- **Animaciones**: aurora y blobs en CSS, marquesina de beneficios, aparición
  por scroll con `IntersectionObserver`, drawer del carrito, modal de producto,
  badge con `pop`, acordeón de FAQ y transición de la rejilla del catálogo.
  Todo respeta `prefers-reduced-motion`.
- **Documentación**: `README.md` con arquitectura, proveedores, variables de
  entorno, alta del webhook, despliegue y próximos pasos; `.env.example` con
  las variables necesarias y valores de ejemplo.
- **Arneses de verificación**: `tools/generate-catalog.js` (normaliza los
  datos del proveedor), `tools/export-catalog.js` (snapshot en céntimos para el
  backend) y `tools/verify-backend.js` (31 comprobaciones de reglas comerciales
  y rutas de error, sin necesidad de claves de Stripe).

### Corregido

- **Validación de país en el checkout**: el formulario envía el nombre del país
  en español y el backend comparaba contra códigos ISO, así que todo pedido
  habría fallado con `400 invalid_country`. Ahora `normalizeCountry()` acepta
  nombre en español, nombre en inglés y código ISO, y normaliza a ISO.
- **Snapshot del catálogo ausente en el build**: `netlify.toml` invocaba un
  script que no existía y `catalog.json` se requería en tiempo de carga. El
  snapshot se genera ahora en `prebuild`, de modo que web y Functions usan
  siempre los mismos precios.

### Cambiado

- `README.md` reescrito: describía 8 productos de demostración, un checkout sin
  pasarela y un fichero `products.data.ts` que ya no existe.
- El build de Netlify pasa a un único punto de entrada (`npm run build`); el
  snapshot del catálogo ya no se duplica en dos sitios.
- El snapshot generado (`netlify/functions/_lib/catalog.json`) queda fuera del
  control de versiones: se deriva de fuentes versionadas.

### Seguridad

- Ninguna credencial en el repositorio: `STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET` y `PUBLIC_SITE_URL` viven solo en variables de
  entorno (`.env` local y ajustes del sitio en Netlify).
- El importe nunca lo fija el navegador: se recalcula en servidor contra el
  snapshot en céntimos, de modo que manipular precios en el cliente no cambia
  el cobro.
- Firma de webhook obligatoria; una firma inválida devuelve `400
  invalid_signature` y no se procesa nada.
- Cabeceras `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy` y
  `Permissions-Policy`; `Cache-Control: no-store` en las Functions.

[1.0.0]: https://github.com/CarlosPerez93/lumiko-store/releases/tag/v1.0.0
