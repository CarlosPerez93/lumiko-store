# Entrega · LUMIKO Smart Play

Documento de handoff. El detalle técnico completo está en [README.md](README.md);
el histórico de versiones, en [CHANGELOG.md](CHANGELOG.md).

## 1. Qué se entrega

| Elemento | Dónde |
|---|---|
| Repositorio versionado | https://github.com/CarlosPerez93/lumiko-store |
| Aplicación desplegada | https://lumiko-store.netlify.app |
| Panel del sitio (Netlify) | https://app.netlify.com/projects/lumiko-store |
| Release actual | [v1.0.1](https://github.com/CarlosPerez93/lumiko-store/releases/tag/v1.0.1) (deploy `6adcc1513378778e9ed8911c`) |
| Documentación técnica | [README.md](README.md) |

Stack sin cambios respecto a lo pedido: **Angular 12.2.17 + Tailwind 3.4 + TypeScript 4.3**,
con Netlify Functions como backend y Stripe Checkout como pasarela.

## 2. Ramas y versiones

```
main     ●── baseline ─────────────────────● 27ec825 (tag v1.0.1) ← producción
           \                              /
dev         ●── feat/storefront-v1 ───────●  ← integración
```

- `main`: solo releases verificados. `dev`: integración diaria. `feat/*`: trabajo por funcionalidad.
- `v1.0.0` (59f959e): primer estado funcional desplegado.
- `v1.0.1` (27ec825): correcciones de la verificación en producción.
- Commits atómicos con ámbito (`fix(catalog):`, `docs(readme):`, `chore(release):`).

## 3. Proveedores integrados

| Proveedor | Adaptador | Productos | Datos que aporta |
|---|---|---|---|
| Alibaba.com (marketplace, CN) | `src/app/core/catalog/alibaba/alibaba.source.ts` | 24 | precio mayorista por tramos, MOQ, imágenes reales, valoración, proveedor verificado, país, plazo y URL de la ficha original |
| ABYstyle · Abysse Corp (distribuidor, FR) | `src/app/core/catalog/abystyle/abystyle.source.ts` | 12 | PVP publicado en EUR, imágenes y ficha reales, plazos, referencia del fabricante y URL de origen |

Cada producto muestra su proveedor de origen y enlaza a la ficha real. El precio de
venta lo fija LUMIKO (`src/app/core/catalog/pricing.ts`).

**Dos economías distintas, una sola fórmula.** El marketplace publica coste de fábrica,
así que se aplica `PRICING_POLICY` (margen 2,6 · mínimo 12,90 € · redondeo 0,10 €). El
distribuidor europeo publica precio de venta al público, así que su fuente declara
`RETAIL_PURCHASE_POLICY` (margen 1,3 ≈ 23 % bruto) para no vender por encima del PVP
oficial. La política viaja en `meta.pricingPolicy` y la aplican tanto `CatalogService`
como el backend: precio mostrado y precio cobrado no pueden divergir.

Ese segundo adaptador es la prueba de que la arquitectura aguanta: entró sin tocar
componentes, rutas, carrito, checkout ni backend, solo con una carpeta y una línea.

**Añadir un proveedor nuevo = 2 pasos** (sin tocar componentes ni rutas):

1. Crear `src/app/core/catalog/<proveedor>/<proveedor>.source.ts` implementando
   `ProductSourceAdapter` (`{ meta, load(): Observable<SupplierProduct[]> }`).
2. Registrar una línea en `app.module.ts`:
   `{ provide: CATALOG_SOURCES, useValue: new MiProveedorSource(), multi: true }`

## 4. Variables de entorno

Se configuran en Netlify (*Project configuration → Environment variables*) o en un
`.env` local para `netlify dev`. Plantilla: [.env.example](.env.example).
**Ningún valor real está en el repositorio.**

| Variable | Estado | Uso |
|---|---|---|
| `PUBLIC_SITE_URL` | **configurada** (`https://lumiko-store.netlify.app`) | URL canónica para `success_url` / `cancel_url` |
| `LUMIKO_ENV` | automática (`netlify.toml`) | `production` / `preview` / `branch` |
| `STRIPE_SECRET_KEY` | **pendiente** | clave secreta de Stripe. Sin ella el checkout responde `503 payments_not_configured` |
| `STRIPE_WEBHOOK_SECRET` | **pendiente** | firma del webhook; sin ella el endpoint rechaza todo evento |

## 5. Estado de la verificación en producción

Ejecutada contra el sitio desplegado el 24 de octubre de 2026:

| Comprobación | Resultado |
|---|---|
| `node tools/verify-production.js` | **34/34 correctas, 0 fallos** |
| Rutas `/`, `/catalogo`, `/producto/:id`, `/carrito`, `/checkout`, `/pedido`, 404 | todas sirven la app (200 + router) |
| Responsive a 375×812 (`/carrito` vacío y lleno, `/checkout`, `/pedido`, `/404`, `/catalogo`) | `scrollWidth == clientWidth`: **sin desbordamiento horizontal** |
| Cabeceras de seguridad y `no-store` en Functions | correctas |
| Validaciones del backend (método, JSON, carrito vacío, producto desconocido, país no cubierto) | correctas |
| Fugas de información en errores | ninguna variable de entorno ni ruta interna expuesta |
| Webhook sin firma | rechazado |

## 6. Lo que falta y por qué

1. **Cobro real (punto 7 y 8 del mandato).** El código está completo y desplegado, pero
   la pasarela no puede activarse sin credenciales: faltan `STRIPE_SECRET_KEY` y
   `STRIPE_WEBHOOK_SECRET`. Con ellas:
   - pegar la clave secreta (`sk_test_…` o `sk_live_…`) en Netlify;
   - crear el endpoint `https://lumiko-store.netlify.app/.netlify/functions/stripe-webhook`
     con los eventos `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
     `checkout.session.async_payment_failed`, `checkout.session.expired`, `payment_intent.payment_failed`;
   - copiar el `whsec_…` como `STRIPE_WEBHOOK_SECRET` y redesplegar.
   En ese momento el arnés pasa de «503 esperado» a «200 con URL de Stripe» y se puede
   cerrar un pago de prueba de punta a punta.
2. **Dominio propio** (el mandato lo deja como «si corresponde»). Hoy la tienda vive en
   `lumiko-store.netlify.app`; un dominio tipo `lumiko.shop` se añade en Netlify con DNS
   y HTTPS automático, sin cambios de código.

   Aclaración tras la revisión del 2026-10-25: `lumiko.com` **no pertenece a este
   proyecto**. Está registrado desde 2005 en GoDaddy, su DNS no apunta a Netlify y
   reenvía a `andrewmelcher.com`. Netlify lo aceptaba como `custom_domain` del sitio
   aunque nunca se verificó la propiedad, y esa asociación era la que hacía que la
   tienda pareciera «rota». Se ha desvinculado (`custom_domain` y `domain_aliases`
   vacíos): el sitio queda canónico en `https://lumiko-store.netlify.app`, con
   `http → 301 https` y certificado válido. Para tener dominio propio hace falta uno
   realmente en propiedad y seguir la Parte B de la guía.
3. ~~**Despliegue continuo.**~~ **Resuelto.** El repositorio está enlazado a Netlify:
    `main` despliega a producción y `dev` genera preview. Verificado con un build real
    disparado desde GitHub (`Production · main@38f1dd2`, 1 m 3 s), no con un deploy local.

## 7. Cómo operar

```bash
npm install          # dependencias
npm start            # http://localhost:4200
npx netlify dev      # http://localhost:8888 con Functions
npm run build        # compila en dist/lumiko
npm run verify:backend    # 46 comprobaciones de reglas comerciales, despacho y redes
node tools/verify-production.js   # 34 comprobaciones contra producción
node tools/check-catalog-search.js  # semántica de búsqueda sobre el catálogo real
npx netlify deploy --build --prod   # publicar
```
