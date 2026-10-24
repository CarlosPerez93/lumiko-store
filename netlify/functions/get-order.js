/**
 * GET /.netlify/functions/get-order?session_id=cs_...
 *
 * Devuelve el estado real del pedido consultando a Stripe. La clave secreta no
 * sale nunca del servidor y el id de sesión se valida antes de usarlo.
 */
const commerce = require('./_lib/commerce');

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
      message: 'La referencia del pago no es válida.'
    });
  }

  const stripe = stripeClient();
  if (!stripe) {
    return commerce.jsonResponse(503, {
      code: 'payments_not_configured',
      message: 'La pasarela de pago todavía no está configurada en este sitio.'
    });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items']
    });

    const lineItems = (session.line_items && session.line_items.data) || [];
    const details = session.customer_details || {};

    const order = {
      id: session.id,
      status: session.status,
      paymentStatus: session.payment_status,
      amountTotal: typeof session.amount_total === 'number' ? session.amount_total / 100 : 0,
      currency: (session.currency || 'eur').toUpperCase(),
      email: details.email || null,
      customerName: details.name || (session.metadata && session.metadata.customer_name) || null,
      reference: (session.metadata && session.metadata.reference) || session.client_reference_id || null,
      // Lo escribe el webhook al confirmar el pago: sirve para saber si el aviso
      // de Stripe llegó, sin abrir el panel.
      webhookStatus: (session.metadata && session.metadata.lumiko_status) || null,
      items: lineItems.map((item) => ({
        name: item.description || 'Producto LUMIKO',
        qty: item.quantity || 1,
        amount: (item.amount_total || 0) / 100
      })),
      createdAt: new Date((session.created || 0) * 1000).toISOString()
    };

    return commerce.jsonResponse(200, order);
  } catch (error) {
    if (error && error.code === 'resource_missing') {
      return commerce.jsonResponse(404, {
        code: 'order_not_found',
        message: 'No encontramos ese pedido. Si acabas de pagar, espera unos segundos y recarga la página.'
      });
    }
    return commerce.errorResponse(error);
  }
};
