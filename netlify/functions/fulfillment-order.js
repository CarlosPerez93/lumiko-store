/**
 * GET /.netlify/functions/fulfillment-order?session_id=cs_...
 *
 * Endpoint administrativo para consultar la orden de compra a proveedores.
 * Resuelve la sesión en Stripe, cruza los productos con las referencias de fábrica
 * (Alibaba.com / ABYstyle), calcula el desglose de costes y márgenes, y entrega
 * los enlaces directos y la dirección de envío del comprador lista para despachar.
 */
const commerce = require('./_lib/commerce');
const fulfillment = require('./_lib/fulfillment');

function stripeClient() {
  const key = (process.env.STRIPE_SECRET_KEY || '').trim();
  if (!key) {
    return null;
  }
  let Stripe;
  try {
    Stripe = require('stripe');
  } catch (loadError) {
    console.error('[lumiko] la dependencia stripe no está en el despliegue:', loadError.message);
    return null;
  }
  return new Stripe(key, { maxNetworkRetries: 2, timeout: 20000 });
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'GET') {
    return commerce.jsonResponse(405, { code: 'method_not_allowed', message: 'Método no permitido.' });
  }

  const sessionId = (event.queryStringParameters && event.queryStringParameters.session_id) || '';
  if (!/^cs_(test_|live_)?[A-Za-z0-9_]{6,}$/.test(sessionId)) {
    return commerce.jsonResponse(400, {
      code: 'invalid_session_id',
      message: 'La referencia de sesión de Stripe no es válida.'
    });
  }

  const stripe = stripeClient();
  if (!stripe) {
    return commerce.jsonResponse(503, {
      code: 'payments_not_configured',
      message: 'La pasarela de pago no está configurada.'
    });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer_details']
    });

    const fulfillmentOrder = fulfillment.buildFulfillmentOrder(session);

    return commerce.jsonResponse(200, fulfillmentOrder);
  } catch (error) {
    if (error && error.code === 'resource_missing') {
      return commerce.jsonResponse(404, {
        code: 'order_not_found',
        message: 'No se encontró la sesión indicada.'
      });
    }
    return commerce.errorResponse(error);
  }
};
