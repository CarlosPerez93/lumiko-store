/**
 * Reglas comerciales de LUMIKO en el servidor.
 *
 * Única fuente de verdad del importe: el navegador envía ids y cantidades,
 * aquí se resuelven contra el snapshot del catálogo y se recalcula todo. Si el
 * cliente intenta manipular precios, el resultado no cambia.
 */
const catalog = require('./catalog.json');

const COUPONS = catalog.coupons;
const FREE_SHIPPING_CENTS = catalog.shipping.freeThreshold;
const SHIPPING_CENTS = catalog.shipping.cost;
const MAX_QTY = 10;
const MAX_LINES = 20;
/**
 * El checkout envía el nombre del país en español; Stripe y las etiquetas
 * necesitan el código ISO. Se aceptan ambos formatos.
 */
const COUNTRY_CODES = {
  'ESPAÑA': 'ES',
  ESPANA: 'ES',
  SPAIN: 'ES',
  ES: 'ES',
  PORTUGAL: 'PT',
  PT: 'PT',
  FRANCIA: 'FR',
  FRANCE: 'FR',
  FR: 'FR',
  ALEMANIA: 'DE',
  GERMANY: 'DE',
  DE: 'DE',
  ITALIA: 'IT',
  ITALY: 'IT',
  IT: 'IT',
  'PAÍSES BAJOS': 'NL',
  'PAISES BAJOS': 'NL',
  'NETHERLANDS': 'NL',
  NL: 'NL',
  BÉLGICA: 'BE',
  BELGICA: 'BE',
  BELGIUM: 'BE',
  BE: 'BE'
};

/** Países con los que LUMIKO opera hoy (mercado único de la UE ampliada). */
const ALLOWED_COUNTRIES = ['ES', 'PT', 'FR', 'DE', 'IT', 'NL', 'BE'];

class OrderError extends Error {
  constructor(code, message, status) {
    super(message);
    this.name = 'OrderError';
    this.code = code;
    this.status = status || 400;
  }
}

function getProduct(id) {
  for (const product of catalog.products) {
    if (product.id === id) {
      return product;
    }
  }
  return null;
}

/** Valida y normaliza las líneas recibidas del navegador. */
function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new OrderError('empty_cart', 'El carrito está vacío.', 400);
  }
  if (items.length > MAX_LINES) {
    throw new OrderError('too_many_lines', 'El pedido supera el máximo de referencias por compra.', 400);
  }

  const merged = {};
  const order = [];

  for (const item of items) {
    const id = item && typeof item.id === 'string' ? item.id.trim() : '';
    const qty = Number(item && item.qty);
    if (!id || !Number.isFinite(qty)) {
      throw new OrderError('invalid_item', 'Hay una línea del carrito con formato no válido.', 400);
    }
    const product = getProduct(id);
    if (!product) {
      throw new OrderError(
        'unknown_product',
        'Uno de los productos ya no está disponible. Actualiza el carrito para continuar.',
        409
      );
    }
    if (merged[id]) {
      continue;
    }
    merged[id] = true;
    order.push({
      id: product.id,
      name: product.name,
      description: product.description,
      unitAmount: product.unitAmount,
      qty: Math.min(Math.max(1, Math.round(qty)), MAX_QTY)
    });
  }

  return order;
}

function couponPercent(rawCode) {
  if (!rawCode) {
    return 0;
  }
  const code = String(rawCode).trim().toUpperCase();
  return COUPONS[code] || 0;
}

/**
 * Recalcula el pedido completo en céntimos.
 * El descuento se aplica al subtotal de producto; el envío se decide después.
 */
function buildOrder(items, rawCoupon) {
  const lines = normalizeItems(items);
  const subtotal = lines.reduce((sum, line) => sum + line.unitAmount * line.qty, 0);
  const percent = couponPercent(rawCoupon);
  const discount = Math.round((subtotal * percent) / 100);
  const payable = subtotal - discount;
  const shipping = payable >= FREE_SHIPPING_CENTS ? 0 : SHIPPING_CENTS;

  return {
    lines,
    subtotal,
    discount,
    shipping,
    total: payable + shipping,
    coupon: percent ? { code: String(rawCoupon).trim().toUpperCase(), percent } : null
  };
}

function normalizeCountry(raw) {
  if (!raw) {
    return '';
  }
  const key = String(raw)
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return COUNTRY_CODES[key] || COUNTRY_CODES[String(raw).trim().toUpperCase()] || '';
}

function validateCustomer(customer) {
  const data = customer || {};
  const name = String(data.name || '').trim();
  const email = String(data.email || '').trim();
  const address = String(data.address || '').trim();
  const city = String(data.city || '').trim();
  const postalCode = String(data.postalCode || '').trim();
  const rawCountry = String(data.country || '').trim();
  const country = normalizeCountry(rawCountry);

  if (name.length < 3) {
    throw new OrderError('invalid_name', 'El nombre del destinatario no es válido.', 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    throw new OrderError('invalid_email', 'El correo electrónico no es válido.', 400);
  }
  if (address.length < 6) {
    throw new OrderError('invalid_address', 'La dirección de envío está incompleta.', 400);
  }
  if (!city) {
    throw new OrderError('invalid_city', 'Falta la ciudad de envío.', 400);
  }
  if (postalCode.length < 3) {
    throw new OrderError('invalid_postal_code', 'El código postal no es válido.', 400);
  }
  if (ALLOWED_COUNTRIES.indexOf(country) === -1) {
    throw new OrderError('invalid_country', 'Todavía no enviamos a ese país.', 400);
  }

  return { name, email, address, city, postalCode, country, notes: String(data.notes || '').trim() };
}

/** Netlify entrega el cuerpo como string; el webhook necesita el original. */
function rawBody(event) {
  if (!event || typeof event.body !== 'string') {
    return '';
  }
  return event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
}

function parseJsonBody(event) {
  const body = rawBody(event);
  if (!body) {
    throw new OrderError('empty_body', 'La petición no incluye datos.', 400);
  }
  try {
    return JSON.parse(body);
  } catch (error) {
    throw new OrderError('invalid_json', 'La petición no es un JSON válido.', 400);
  }
}

function jsonResponse(statusCode, payload, extraHeaders) {
  return {
    statusCode,
    headers: Object.assign(
      {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      },
      extraHeaders || {}
    ),
    body: JSON.stringify(payload)
  };
}

function errorResponse(error) {
  const isOrderError = error && error.name === 'OrderError';

  // Los errores de Stripe se contestan aparte: cuando la pasarela está mal
  // configurada (clave inválida, cuenta sin activar) reintentar no arregla
  // nada, así que no se le puede decir al comprador «inténtalo en unos
  // segundos». El detalle va al log, nunca a la respuesta.
  const isGatewayError =
    Boolean(error) && typeof error.type === 'string' && error.type.indexOf('Stripe') === 0;

  if (isGatewayError) {
    console.error(
      '[lumiko] error de pasarela:',
      error.type,
      error.code || '',
      error.message || ''
    );
    const misconfigured =
      error.type === 'StripeAuthenticationError' || error.code === 'api_key_invalid';
    return jsonResponse(500, {
      code: misconfigured ? 'payment_gateway_misconfigured' : 'payment_gateway_error',
      message:
        'El pago con tarjeta no está disponible ahora mismo. Escríbenos y completamos tu pedido sin pasar por la pasarela.'
    });
  }

  const status = isOrderError ? error.status : 500;
  const code = isOrderError ? error.code : 'internal_error';
  const message = isOrderError
    ? error.message
    : 'No hemos podido procesar el pedido. Inténtalo de nuevo en unos segundos.';

  if (!isOrderError) {
    console.error('[lumiko] error no controlado:', error && error.stack ? error.stack : error);
  }
  return jsonResponse(status, { code, message });
}

module.exports = {
  catalog,
  COUPONS,
  FREE_SHIPPING_CENTS,
  SHIPPING_CENTS,
  MAX_QTY,
  MAX_LINES,
  ALLOWED_COUNTRIES,
  COUNTRY_CODES,
  OrderError,
  normalizeCountry,
  buildOrder,
  couponPercent,
  validateCustomer,
  rawBody,
  parseJsonBody,
  jsonResponse,
  errorResponse
};
