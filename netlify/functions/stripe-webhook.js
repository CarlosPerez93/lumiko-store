/**
 * POST /.netlify/functions/stripe-webhook
 *
 * Recibe los eventos de Stripe, verifica la firma con STRIPE_WEBHOOK_SECRET y
 * deja constancia del estado final del pago en la propia sesión (metadata), que
 * es la fuente de verdad que consulta /get-order.
 *
 * No se usa base de datos: Stripe es el registro del pedido. El webhook aporta
 * la confirmación asíncrona (pagos con autenticación fuerte, métodos diferidos)
 * y la traza de auditoría en los logs de la función.
 */
const commerce = require('./_lib/commerce');

const HANDLED = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'checkout.session.expired',
  'payment_intent.payment_failed'
];

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return null;
  }
  const Stripe = require('stripe');
  return new Stripe(key, { maxNetworkRetries: 2, timeout: 20000 });
}

const STATUS_BY_EVENT = {
  'checkout.session.completed': 'confirmed',
  'checkout.session.async_payment_succeeded': 'confirmed',
  'checkout.session.async_payment_failed': 'payment_failed',
  'checkout.session.expired': 'expired'
};

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return commerce.jsonResponse(405, { code: 'method_not_allowed', message: 'Método no permitido.' });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripe = stripeClient();

  if (!secret || !stripe) {
    // 503 hace que Stripe reintente cuando el secreto se configure.
    return commerce.jsonResponse(503, {
      code: 'webhook_not_configured',
      message: 'El webhook no está configurado: falta STRIPE_WEBHOOK_SECRET o STRIPE_SECRET_KEY.'
    });
  }

  const signature = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
  if (!signature) {
    return commerce.jsonResponse(400, { code: 'missing_signature', message: 'Falta la cabecera stripe-signature.' });
  }

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(commerce.rawBody(event), signature, secret);
  } catch (error) {
    // Firma inválida = petición no fiable. Nunca se procesa.
    console.error('[lumiko] webhook firma inválida:', error && error.message);
    return commerce.jsonResponse(400, { code: 'invalid_signature', message: 'La firma del webhook no es válida.' });
  }

  if (HANDLED.indexOf(stripeEvent.type) === -1) {
    return commerce.jsonResponse(200, { received: true, ignored: stripeEvent.type });
  }

  try {
    if (stripeEvent.type === 'payment_intent.payment_failed') {
      const intent = stripeEvent.data.object;
      console.warn('[lumiko] pago fallido', intent && intent.id, intent && intent.last_payment_error && intent.last_payment_error.code);
      return commerce.jsonResponse(200, { received: true });
    }

    const session = stripeEvent.data.object;
    const reference = (session.metadata && session.metadata.reference) || session.client_reference_id || session.id;
    const status = STATUS_BY_EVENT[stripeEvent.type] || 'received';

    // Traza de auditoría: importe real cobrado y estado consolidado.
    console.log(
      '[lumiko] webhook ' + stripeEvent.type + ' ref=' + reference + ' session=' + session.id +
        ' payment_status=' + session.payment_status + ' amount=' + session.amount_total +
        ' estado=' + status
    );

    try {
      await stripe.checkout.sessions.update(session.id, {
        metadata: {
          reference: reference,
          lumiko_status: status,
          lumiko_event: stripeEvent.type,
          lumiko_updated_at: new Date().toISOString()
        }
      });
    } catch (updateError) {
      // Un fallo al anotar la metadata no debe provocar reintentos infinitos.
      console.error('[lumiko] no se pudo actualizar la metadata:', updateError && updateError.message);
    }

    return commerce.jsonResponse(200, { received: true, status: status });
  } catch (error) {
    console.error('[lumiko] error procesando webhook:', error && error.stack ? error.stack : error);
    return commerce.jsonResponse(500, { code: 'webhook_error', message: 'Error procesando el evento.' });
  }
};
