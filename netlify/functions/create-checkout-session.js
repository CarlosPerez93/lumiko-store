/**
 * POST /.netlify/functions/create-checkout-session
 *
 * Crea una sesión de Stripe Checkout con el importe recalculado en servidor.
 * La clave secreta vive solo en las variables de entorno del sitio: este
 * fichero nunca contiene credenciales.
 */
const commerce = require('./_lib/commerce');

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return null;
  }
  // require diferido: si Stripe no está instalado, el error es explícito y no
  // tumba el arranque de la función.
  const Stripe = require('stripe');
  return new Stripe(key, { maxNetworkRetries: 2, timeout: 20000 });
}

function siteUrl() {
  const explicit = process.env.PUBLIC_SITE_URL;
  if (explicit) {
    return explicit.replace(/\/+$/, '');
  }
  if (process.env.URL) {
    return process.env.URL.replace(/\/+$/, '');
  }
  if (process.env.DEPLOY_PRIME_URL) {
    return process.env.DEPLOY_PRIME_URL.replace(/\/+$/, '');
  }
  return 'http://localhost:8888';
}

/**
 * Stripe no acepta descuentos ad-hoc: se reutiliza (o se crea) un cupón con id
 * determinista por código, para no generar basura en la cuenta.
 */
async function ensureCoupon(stripe, code, percent) {
  const id = 'LUMIKO_' + code.toUpperCase();
  try {
    return await stripe.coupons.retrieve(id);
  } catch (error) {
    if (error && error.code === 'resource_missing') {
      return await stripe.coupons.create({
        id,
        percent_off: percent,
        duration: 'once',
        name: code.toUpperCase() + ' · LUMIKO'
      });
    }
    throw error;
  }
}

/** Metadata admite 500 caracteres por clave: troceamos si hace falta. */
function itemsMetadata(lines) {
  const meta = {};
  let bucket = '';
  let index = 1;
  for (const line of lines) {
    const token = line.id + ':' + line.qty;
    if ((bucket + ',' + token).length > 480) {
      meta['items_' + index] = bucket.replace(/^,/, '');
      index += 1;
      bucket = '';
    }
    bucket += ',' + token;
  }
  meta.items = bucket.replace(/^,/, '');
  return meta;
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return commerce.jsonResponse(204, {});
  }
  if (event.httpMethod !== 'POST') {
    return commerce.jsonResponse(405, { code: 'method_not_allowed', message: 'Método no permitido.' });
  }

  try {
    const payload = commerce.parseJsonBody(event);
    const order = commerce.buildOrder(payload.items, payload.coupon);
    const customer = commerce.validateCustomer(payload.customer);

    const stripe = stripeClient();
    if (!stripe) {
      return commerce.jsonResponse(503, {
        code: 'payments_not_configured',
        message:
          'La pasarela de pago todavía no está configurada en este sitio. Añade STRIPE_SECRET_KEY en las variables de entorno de Netlify para activar los pagos.'
      });
    }

    const reference = 'LMK-' + Date.now().toString(36).toUpperCase();
    const base = siteUrl();

    const sessionParams = {
      mode: 'payment',
      locale: 'es',
      payment_method_types: ['card'],
      client_reference_id: reference,
      customer_email: customer.email,
      billing_address_collection: 'required',
      shipping_address_collection: { allowed_countries: commerce.ALLOWED_COUNTRIES },
      line_items: order.lines.map((line) => ({
        quantity: line.qty,
        price_data: {
          currency: commerce.catalog.currency,
          unit_amount: line.unitAmount,
          product_data: {
            name: line.name.length > 120 ? line.name.slice(0, 117) + '...' : line.name,
            description: line.description
          }
        }
      })),
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            display_name: order.shipping === 0 ? 'Envío gratis' : 'Envío estándar',
            fixed_amount: { amount: order.shipping, currency: commerce.catalog.currency },
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 5 },
              maximum: { unit: 'business_day', value: 12 }
            }
          }
        }
      ],
      metadata: Object.assign(
        {
          reference,
          customer_name: customer.name.slice(0, 480),
          customer_address: (customer.address + ', ' + customer.postalCode + ' ' + customer.city + ' (' + customer.country + ')').slice(0, 480),
          customer_notes: customer.notes.slice(0, 480),
          coupon: order.coupon ? order.coupon.code : '',
          computed_total: String(order.total)
        },
        itemsMetadata(order.lines)
      ),
      success_url: base + '/pedido?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: base + '/pedido?canceled=1'
    };

    if (order.coupon) {
      const coupon = await ensureCoupon(stripe, order.coupon.code, order.coupon.percent);
      sessionParams.discounts = [{ coupon: coupon.id }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log(
      '[lumiko] checkout ' + reference + ' total=' + order.total + 'c lineas=' + order.lines.length +
        ' cupon=' + (order.coupon ? order.coupon.code : 'no')
    );

    return commerce.jsonResponse(200, { id: session.id, url: session.url, reference });
  } catch (error) {
    return commerce.errorResponse(error);
  }
};
