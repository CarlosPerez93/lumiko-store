# Guía paso a paso · Stripe y dominio propio

Dos tareas que dependen de material que solo tú puedes aportar: las claves de tu cuenta
de Stripe y un dominio a tu nombre. Todo lo demás ya está hecho y desplegado, así que
estas listas empiezan donde acaba el código.

- **Parte A** deja la tienda cobrando de verdad (hoy responde `503 payments_not_configured`).
- **Parte B** cambia `lumiko-store.netlify.app` por un dominio propio con HTTPS.

Antes de empezar: https://app.netlify.com/projects/lumiko-store y
https://dashboard.stripe.com abiertos en el navegador.

---

## Parte A · Stripe

### A0. Qué se va a configurar y por qué hacen falta dos claves

| Clave | Para qué sirve | Dónde se pega |
|---|---|---|
| `STRIPE_SECRET_KEY` (`sk_test_…` / `sk_live_…`) | crear la sesión de pago en el servidor | variable de entorno de Netlify |
| `STRIPE_WEBHOOK_SECRET` (`whsec_…`) | verificar que el aviso de pago lo manda Stripe y no un tercero | variable de entorno de Netlify |

La clave **pública** no se usa: el navegador nunca habla con Stripe, solo recibe la URL
de `checkout.stripe.com` que devuelve la Function. Por eso el importe se recalcula en
servidor y un cliente no puede pagar 1 céntimo por una lámpara de 64,90 €.

### A1. Copiar la clave secreta (modo test)

1. Entra en https://dashboard.stripe.com.
2. Arriba a la derecha, activa **Test mode**. Trabaja en test hasta el paso A8.
3. Menú **Developers → API keys**.
4. En *Secret key*, pulsa **Reveal test key** y copia el valor (`sk_test_…`).
   No lo pegues en ningún chat, issue ni fichero del repositorio.

### A2. Guardarla en Netlify

1. Netlify → proyecto **lumiko-store** → **Project configuration → Environment variables**.
2. **Add a variable → Single variable**.
3. Key: `STRIPE_SECRET_KEY` · Value: el `sk_test_…` · Scopes: deja **All** (o al menos
   *Functions* y *Runtime*).
4. **Create variable**. Aún no despliegues: primero el webhook, para hacer un solo redeploy.

### A3. Crear el endpoint del webhook

1. Stripe (seguimos en **Test mode**) → **Developers → Webhooks → Add endpoint**.
2. *Endpoint URL*, exactamente:

   ```
   https://lumiko-store.netlify.app/.netlify/functions/stripe-webhook
   ```

3. *Description*: `LUMIKO checkout`.
4. *Events to send* → **+ Select events** → marca estos cinco y ninguno más:

   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`

   Son los que el código sabe interpretar (`netlify/functions/stripe-webhook.js`). Los
   tres primeros confirman el pedido, el cuarto lo marca caducado y el quinto registra
   el fallo de tarjeta.
5. **Add endpoint**.

### A4. Copiar el secreto de firma

1. En la página del endpoint recién creado, bloque **Signing secret** → **Reveal**.
2. Copia el `whsec_…`.

> Este secreto es **de este endpoint y de este modo**. El endpoint de producción (live)
> tendrá otro distinto: no los intercambies.

### A5. Guardarlo en Netlify

Igual que A2, con Key `STRIPE_WEBHOOK_SECRET` y Value el `whsec_…`, scopes **All**.

Deberías tener dos variables nuevas junto a la que ya existía:

```
PUBLIC_SITE_URL        https://lumiko-store.netlify.app   (ya estaba)
STRIPE_SECRET_KEY      sk_test_…                          (nueva)
STRIPE_WEBHOOK_SECRET  whsec_…                            (nueva)
```

### A6. Redesplegar para que las Functions lean las variables

Las Functions leen el entorno al arrancar: sin redeploy siguen en `503`.

1. Netlify → **Deploys → Trigger deploy → Clear cache and deploy site**.
2. Espera a que el deploy quede en *Published* (1–2 min).

### A7. Verificar que el cobro está activo

```bash
node tools/verify-production.js
```

El arnés detecta solo el cambio de estado: antes comprobaba «503 esperado», ahora exige
**200 con `cs_…` y URL de `checkout.stripe.com`**. Si sigue en 503, revisa que las dos
variables estén en el scope *Functions* y que el redeploy haya terminado.

### A8. Pago de prueba de punta a punta

1. Abre https://lumiko-store.netlify.app, añade una lámpara al carrito y ve a `/checkout`.
2. Rellena los datos y pulsa pagar: te lleva al checkout de Stripe.
3. Tarjeta de prueba: `4242 4242 4242 4242`, caducidad futura cualquiera, CVC
   cualquiera, código postal cualquiera.
4. Al terminar vuelves a `/pedido?session_id=cs_…` y la página muestra el pedido
   confirmado con su estado real.
5. En Stripe → **Developers → Webhooks → tu endpoint → Events**: el evento
   `checkout.session.completed` debe figurar con respuesta **200**.

Para ver el camino de error, repite con `4000 0000 0000 0002` (tarjeta rechazada): el
pedido queda como pago fallido, no como confirmado.

### A9. Pasar a dinero real (cuando quieras)

1. Desactiva **Test mode** en Stripe.
2. **Developers → API keys** → copia la `sk_live_…` y **sustituye** `STRIPE_SECRET_KEY`.
3. **Developers → Webhooks → Add endpoint** de nuevo, misma URL, mismos cinco eventos
   (los endpoints de test y live son independientes). Copia su `whsec_…` y **sustituye**
   `STRIPE_WEBHOOK_SECRET`.
4. Redeploy (A6) y repite A7 con una compra real pequeña.

### A10. Opcional: probar en local

Con `npx netlify dev` (http://localhost:8888) puedes reenviar eventos reales a tu máquina:

```bash
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
```

El `whsec_…` que imprime ese comando es distinto: va en tu `.env` local, nunca en Netlify.

---

## Parte B · Dominio propio

Requisito: un dominio del que seas titular. No se puede configurar sin él, y no conviene
inventarse uno que ya esté registrado.

### B1. Elegir el dominio

- Si ya tienes uno, salta a B2.
- Si no, compra `lumiko.shop` (o el que prefieras) en cualquier registrador
  (Cloudflare Registrar, Namecheap, IONOS…) o desde el buscador de dominios de Netlify.
  Un `.shop` o un `.es` suele ser más barato que un `.com`; el precio exacto lo marca
  el registrador, no lo fijamos aquí.

### B2. Añadirlo en Netlify

1. Netlify → proyecto **lumiko-store** → **Domain management → Add a domain**.
2. Escribe el dominio (por ejemplo `lumiko.shop`) y confirma. Netlify lo añade como
   *domain alias* del sitio; la web sigue sirviéndose igual mientras propagas el DNS.

### B3. Apuntar el DNS — elige una de las dos rutas

**Ruta 1 · Netlify DNS (recomendada).** Netlify te da un juego de *nameservers*. En tu
registrador, cambia los nameservers del dominio por esos. Netlify gestiona a partir de
ahí los registros, el CDN y el certificado.

**Ruta 2 · DNS externo.** Si prefieres mantener el DNS donde lo tienes (Cloudflare,
Route 53…), Netlify te muestra los registros exactos a crear. Cópialos **de la pantalla**,
no de un tutorial: son un `A` para el dominio raíz y un `CNAME` para `www` apuntando a
`lumiko-store.netlify.app`. Si tu proveedor hace *proxy* (nube naranja de Cloudflare),
desactívalo para esos registros mientras Netlify valida.

La propagación tarda entre minutos y unas horas.

### B4. HTTPS

En **Domain management → HTTPS**, cuando el DNS ya resuelva, pulsa **Verify DNS
configuration** y luego **Provision certificate**. Netlify emite un certificado
Let's Encrypt gratuito y lo renueva solo.

### B5. Elegir el dominio canónico

- Marca `lumiko.shop` (o `www.lumiko.shop`) como **primary domain**.
- Activa **Force HTTPS**: todo `http://` redirige a `https://`.
- El otro pasa a redirigir al primario, así no hay contenido duplicado.

### B6. Actualizar la configuración de la app

Dos sitios, porque la URL canónica la usan las Functions para `success_url`/`cancel_url`:

1. Netlify → **Environment variables** → `PUBLIC_SITE_URL` →
   `https://lumiko.shop` → redeploy (A6).
2. Stripe → **Webhooks** → añade un endpoint con la URL nueva
   `https://lumiko.shop/.netlify/functions/stripe-webhook` y los mismos cinco eventos,
   y actualiza `STRIPE_WEBHOOK_SECRET` con su secreto. Mantén el endpoint de
   `netlify.app` hasta comprobar que el nuevo recibe eventos con 200; luego bórralo.

### B7. Verificar

```bash
node tools/verify-production.js https://lumiko.shop
```

El arnés acepta la URL como argumento y repite las 34 comprobaciones contra el dominio
nuevo: rutas SPA, cabeceras, validaciones del backend, webhook sin firma y estado del
checkout. Después, repite A8 (compra de prueba) desde el dominio nuevo.

---

## Resumen de lo que queda en tus manos

| Paso | Quién | Tiempo |
|---|---|---|
| A1–A6 · pegar claves y crear webhook | tú, con esta guía | 10 min |
| A7–A8 · verificar y pagar en test | tú (yo puedo ejecutar A7 si me lo pides) | 5 min |
| A9 · pasar a live | tú, cuando quieras cobrar | 5 min |
| B1 · conseguir el dominio | tú | depende del registrador |
| B2–B5 · Netlify + DNS + HTTPS | tú, o yo si me das acceso al panel del dominio | 15 min + propagación |
| B6–B7 · actualizar URLs y verificar | yo, en cuanto exista el dominio | 10 min |

En cuanto el dominio exista y las claves estén puestas, dime el dominio y ejecuto B6,
B7 y el A7 para dejarlo cerrado y comprobado.
