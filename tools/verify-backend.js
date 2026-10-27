/**
 * Comprobación funcional del backend de tienda (Netlify Functions).
 *
 * No necesita claves de Stripe: valida las reglas comerciales, la seguridad del
 * recálculo de importes y las rutas de error. Se ejecuta con `npm run verify:backend`
 * y sirve como red de seguridad antes de desplegar.
 */
const path = require('path');
const assert = require('assert');

const libDir = path.join(__dirname, '..', 'netlify', 'functions');
const commerce = require(path.join(libDir, '_lib', 'commerce.js'));
const fulfillment = require(path.join(libDir, '_lib', 'fulfillment.js'));
const socialPublisher = require(path.join(libDir, '_lib', 'social-publisher.js'));
const createSession = require(path.join(libDir, 'create-checkout-session.js'));
const getOrder = require(path.join(libDir, 'get-order.js'));
const webhook = require(path.join(libDir, 'stripe-webhook.js'));
const fulfillmentOrderHandler = require(path.join(libDir, 'fulfillment-order.js'));
const publishSocialHandler = require(path.join(libDir, 'publish-social.js'));

let passed = 0;
const failures = [];

function check(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed += 1;
      console.log('  ok   ' + name);
    })
    .catch((error) => {
      failures.push(name + ' :: ' + (error && error.message ? error.message : error));
      console.log('  FAIL ' + name + ' :: ' + (error && error.message ? error.message : error));
    });
}

function postEvent(payload) {
  return { httpMethod: 'POST', body: JSON.stringify(payload), isBase64Encoded: false };
}

const CUSTOMER = {
  name: 'Carlos Perez',
  email: 'carlos@example.com',
  address: 'Calle Mayor 12, 3B',
  city: 'Madrid',
  postalCode: '28013',
  country: 'España'
};

async function main() {
  const products = commerce.catalog.products;

  console.log('\nCatálogo en servidor');
  const sources = commerce.catalog.sources || [];
  await check('el snapshot declara sus fuentes', () => {
    assert.ok(sources.length >= 2, 'se esperaban al menos 2 fuentes, hay ' + sources.length);
    const ids = sources.map((s) => s.id);
    assert.ok(ids.indexOf('alibaba') !== -1, 'falta la fuente alibaba');
    assert.ok(ids.indexOf('abystyle') !== -1, 'falta la fuente abystyle');
  });
  await check('el número de productos cuadra con la suma de las fuentes', () => {
    const total = sources.reduce((sum, s) => sum + s.products, 0);
    assert.strictEqual(products.length, total);
    assert.ok(products.length >= 24, 'catálogo por debajo del mínimo histórico');
  });
  await check('cada fuente tiene su propia política de precios', () => {
    const alibaba = sources.filter((s) => s.id === 'alibaba')[0];
    const abystyle = sources.filter((s) => s.id === 'abystyle')[0];
    assert.ok(alibaba.pricingPolicy.marginMultiplier > 2, 'el marketplace debe ir a precio mayorista');
    assert.ok(abystyle.pricingPolicy.marginMultiplier < 1.5, 'el distribuidor publica PVP: margen bajo');
    assert.notStrictEqual(alibaba.pricingPolicy.marginMultiplier, abystyle.pricingPolicy.marginMultiplier);
  });
  await check('todos los precios son enteros en céntimos > 0', () =>
    products.forEach((p) => {
      assert.ok(Number.isInteger(p.unitAmount), p.id + ' no es entero');
      assert.ok(p.unitAmount > 0, p.id + ' sin precio');
    }));
  await check('todos los ids son únicos', () =>
    assert.strictEqual(new Set(products.map((p) => p.id)).size, products.length));
  await check('moneda eur', () => assert.strictEqual(commerce.catalog.currency, 'eur'));
  await check('envío gratis desde 49,00 €', () => assert.strictEqual(commerce.FREE_SHIPPING_CENTS, 4900));
  await check('envío estándar 4,95 €', () => assert.strictEqual(commerce.SHIPPING_CENTS, 495));

  console.log('\nCálculo del pedido');
  const cheap = products.filter((p) => p.unitAmount < 4000)[0];
  const pricey = products.filter((p) => p.unitAmount > 4900)[0];

  await check('una unidad barata suma envío', () => {
    const order = commerce.buildOrder([{ id: cheap.id, qty: 1 }], null);
    assert.strictEqual(order.subtotal, cheap.unitAmount);
    assert.strictEqual(order.shipping, 495);
    assert.strictEqual(order.total, cheap.unitAmount + 495);
  });
  await check('un producto caro no paga envío', () => {
    const order = commerce.buildOrder([{ id: pricey.id, qty: 1 }], null);
    assert.strictEqual(order.shipping, 0);
  });
  await check('el descuento se aplica antes de decidir el envío', () => {
    const order = commerce.buildOrder([{ id: pricey.id, qty: 1 }], 'LUMI10');
    assert.strictEqual(order.discount, Math.round((pricey.unitAmount * 10) / 100));
    assert.strictEqual(order.shipping, 0);
  });
  await check('cupón desconocido no descuenta', () => {
    const order = commerce.buildOrder([{ id: product3().id, qty: 1 }], 'NOEXISTE');
    assert.strictEqual(order.discount, 0);
    assert.strictEqual(order.coupon, null);
  });
  await check('cupón en minúsculas funciona', () => {
    const order = commerce.buildOrder([{ id: product3().id, qty: 1 }], 'anime15');
    assert.strictEqual(order.coupon.code, 'ANIME15');
    assert.strictEqual(order.coupon.percent, 15);
  });
  await check('la cantidad se acota a 10', () => {
    const order = commerce.buildOrder([{ id: cheap.id, qty: 999 }], null);
    assert.strictEqual(order.lines[0].qty, 10);
  });
  await check('líneas duplicadas se fusionan en una', () => {
    const order = commerce.buildOrder([{ id: cheap.id, qty: 1 }, { id: cheap.id, qty: 2 }], null);
    assert.strictEqual(order.lines.length, 1);
  });
  await check('el importe no depende de precios enviados por el cliente', () => {
    const order = commerce.buildOrder([{ id: cheap.id, qty: 1, price: 0.01, unitAmount: 1 }], null);
    assert.strictEqual(order.subtotal, cheap.unitAmount);
  });

  function product3() {
    return products[2];
  }

  console.log('\nValidación de entrada');
  const expectCode = (fn, code) => {
    try {
      fn();
    } catch (error) {
      assert.strictEqual(error.code, code);
      return;
    }
    throw new Error('se esperaba el código ' + code);
  };

  await check('carrito vacío -> empty_cart', () => expectCode(() => commerce.buildOrder([], null), 'empty_cart'));
  await check('producto inexistente -> unknown_product', () =>
    expectCode(() => commerce.buildOrder([{ id: 'no-existe', qty: 1 }], null), 'unknown_product'));
  await check('más de 20 líneas -> too_many_lines', () => {
    const items = [];
    for (let i = 0; i < 21; i += 1) {
      items.push({ id: products[i % products.length].id + (i >= products.length ? '-x' : ''), qty: 1 });
    }
    expectCode(() => commerce.buildOrder(items, null), 'too_many_lines');
  });
  await check('país fuera de reparto -> invalid_country', () =>
    expectCode(() => commerce.validateCustomer(Object.assign({}, CUSTOMER, { country: 'Estados Unidos' })), 'invalid_country'));
  await check('email inválido -> invalid_email', () =>
    expectCode(() => commerce.validateCustomer(Object.assign({}, CUSTOMER, { email: 'sin-arroba' })), 'invalid_email'));
  await check('nombre demasiado corto -> invalid_name', () =>
    expectCode(() => commerce.validateCustomer(Object.assign({}, CUSTOMER, { name: 'Al' })), 'invalid_name'));
  await check('el nombre del país se normaliza a ISO', () => {
    assert.strictEqual(commerce.validateCustomer(CUSTOMER).country, 'ES');
    assert.strictEqual(commerce.validateCustomer(Object.assign({}, CUSTOMER, { country: 'Alemania' })).country, 'DE');
    assert.strictEqual(commerce.validateCustomer(Object.assign({}, CUSTOMER, { country: 'fr' })).country, 'FR');
  });
  await check('cliente válido devuelve datos limpios', () => {
    const clean = commerce.validateCustomer(CUSTOMER);
    assert.deepStrictEqual(clean, {
      name: CUSTOMER.name,
      email: CUSTOMER.email,
      address: CUSTOMER.address,
      city: CUSTOMER.city,
      postalCode: CUSTOMER.postalCode,
      country: 'ES',
      notes: ''
    });
  });

  console.log('\nEndpoints (rutas sin Stripe)');
  await check('GET create-checkout-session -> 405', async () => {
    const res = await createSession.handler({ httpMethod: 'GET', body: null });
    assert.strictEqual(res.statusCode, 405);
  });
  await check('POST con JSON inválido -> 400 invalid_json', async () => {
    const res = await createSession.handler({ httpMethod: 'POST', body: '{no-json' });
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(JSON.parse(res.body).code, 'invalid_json');
  });
  await check('POST sin STRIPE_SECRET_KEY -> 503 payments_not_configured', async () => {
    const previous = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;
    const res = await createSession.handler(
      postEvent({ items: [{ id: products[0].id, qty: 1 }], customer: CUSTOMER, coupon: null })
    );
    if (previous) {
      process.env.STRIPE_SECRET_KEY = previous;
    }
    assert.strictEqual(res.statusCode, 503);
    assert.strictEqual(JSON.parse(res.body).code, 'payments_not_configured');
  });
  await check('una clave con solo espacios cuenta como ausente -> 503', async () => {
    const previous = process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_SECRET_KEY = '   \n  ';
    const res = await createSession.handler(
      postEvent({ items: [{ id: products[0].id, qty: 1 }], customer: CUSTOMER, coupon: null })
    );
    if (previous) {
      process.env.STRIPE_SECRET_KEY = previous;
    } else {
      delete process.env.STRIPE_SECRET_KEY;
    }
    assert.strictEqual(res.statusCode, 503);
    assert.strictEqual(JSON.parse(res.body).code, 'payments_not_configured');
  });
  await check('get-order sin session_id -> 400', async () => {
    const res = await getOrder.handler({ httpMethod: 'GET', queryStringParameters: null });
    assert.strictEqual(res.statusCode, 400);
  });
  await check('get-order con id con formato inválido -> 400', async () => {
    const res = await getOrder.handler({ httpMethod: 'GET', queryStringParameters: { session_id: '../../etc/passwd' } });
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(JSON.parse(res.body).code, 'invalid_session_id');
  });
  await check('POST get-order -> 405', async () => {
    const res = await getOrder.handler({ httpMethod: 'POST', queryStringParameters: null });
    assert.strictEqual(res.statusCode, 405);
  });
  await check('webhook sin configurar -> 503 payments_not_configured', async () => {
    const previousSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const previousKey = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_SECRET_KEY;
    const res = await webhook.handler({ httpMethod: 'POST', headers: {}, body: '{}' });
    if (previousSecret) {
      process.env.STRIPE_WEBHOOK_SECRET = previousSecret;
    }
    if (previousKey) {
      process.env.STRIPE_SECRET_KEY = previousKey;
    }
    assert.strictEqual(res.statusCode, 503);
    assert.strictEqual(JSON.parse(res.body).code, 'webhook_not_configured');
  });
  await check('webhook configurado sin firma -> 400 missing_signature', async () => {
    const previousSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const previousKey = process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_placeholder';
    process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
    const res = await webhook.handler({ httpMethod: 'POST', headers: {}, body: '{}' });
    if (previousSecret) {
      process.env.STRIPE_WEBHOOK_SECRET = previousSecret;
    } else {
      delete process.env.STRIPE_WEBHOOK_SECRET;
    }
    if (previousKey) {
      process.env.STRIPE_SECRET_KEY = previousKey;
    } else {
      delete process.env.STRIPE_SECRET_KEY;
    }
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(JSON.parse(res.body).code, 'missing_signature');
  });
  await check('webhook con firma falsa -> 400 invalid_signature', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_placeholder';
    process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
    const res = await webhook.handler({
      httpMethod: 'POST',
      headers: { 'stripe-signature': 't=1,v1=deadbeef' },
      body: '{"type":"checkout.session.completed"}'
    });
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_SECRET_KEY;
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(JSON.parse(res.body).code, 'invalid_signature');
  });

  console.log('\nAutomatización de despacho a proveedores (Fulfillment)');
  await check('extrae la dirección de envío del cliente', () => {
    const session = {
      metadata: { customer_name: 'Ana García', customer_address: 'Gran Vía 40' },
      shipping_details: {
        name: 'Ana García',
        address: { line1: 'Gran Vía 40', city: 'Madrid', postal_code: '28013', country: 'ES' },
        phone: '+34600112233'
      },
      customer_email: 'ana@example.com'
    };
    const addr = fulfillment.extractShippingAddress(session);
    assert.strictEqual(addr.recipientName, 'Ana García');
    assert.strictEqual(addr.city, 'Madrid');
    assert.strictEqual(addr.countryCode, 'ES');
    assert.strictEqual(addr.phone, '+34600112233');
    assert.ok(addr.formattedBlock.includes('Gran Vía 40'));
  });

  await check('construye la orden de compra calculando coste y beneficio', () => {
    const session = {
      id: 'cs_test_mock_123',
      amount_total: 3930,
      currency: 'eur',
      metadata: {
        reference: 'LMK-TEST001',
        customer_name: 'Carlos Perez',
        customer_address: 'Calle Mayor 12',
        items: 'marco-pixel-32:1'
      }
    };
    const order = fulfillment.buildFulfillmentOrder(session);
    assert.strictEqual(order.orderReference, 'LMK-TEST001');
    assert.strictEqual(order.status, 'ready_for_supplier_purchase');
    assert.strictEqual(order.purchaseList.length, 1);
    const item = order.purchaseList[0];
    assert.strictEqual(item.productId, 'marco-pixel-32');
    assert.ok(item.supplier.buyUrl.includes('alibaba.com'));
    assert.ok(order.financials.estimatedGrossProfitEur > 0);
    assert.ok(order.financials.grossProfitMarginPercent > 0);
    assert.strictEqual(order.actionsSummary.length, 1);
  });

  await check('despacha orden sin webhook configurado registrando log', async () => {
    delete process.env.FULFILLMENT_WEBHOOK_URL;
    const res = await fulfillment.dispatchFulfillmentOrder({
      orderReference: 'LMK-LOG',
      stripeSessionId: 'cs_test_log',
      financials: { chargedToCustomerEur: 40, estimatedSupplierCostEur: 15, estimatedGrossProfitEur: 25 },
      customerShipping: { recipientName: 'Test', countryCode: 'ES' },
      purchaseList: []
    });
    assert.strictEqual(res.dispatched, false);
    assert.strictEqual(res.reason, 'no_webhook_configured');
  });

  await check('fulfillment-order rechaza peticiones no GET o id inválido', async () => {
    const postRes = await fulfillmentOrderHandler.handler({ httpMethod: 'POST' });
    assert.strictEqual(postRes.statusCode, 405);
    const badId = await fulfillmentOrderHandler.handler({ httpMethod: 'GET', queryStringParameters: { session_id: 'bad' } });
    assert.strictEqual(badId.statusCode, 400);
  });

  console.log('\nAutomatización y despacho de campañas a redes sociales');
  await check('construye el payload estandarizado para redes', () => {
    const payload = socialPublisher.buildSocialPayload({
      title: 'Título test',
      caption: 'Copy test',
      videoUrl: 'https://example.com/video.mp4',
      platforms: ['tiktok', 'instagram'],
      hashtags: ['#Anime', '#LUMIKO']
    });
    assert.ok(payload.campaignId.startsWith('CMP-'));
    assert.strictEqual(payload.media.type, 'video');
    assert.strictEqual(payload.media.videoUrl, 'https://example.com/video.mp4');
    assert.deepStrictEqual(payload.targetPlatforms, ['tiktok', 'instagram']);
    assert.ok(payload.copywriting.fullFormattedPost.includes('LUMI10'));
  });

  await check('despacho de redes maneja ausencia de webhook sin error', async () => {
    delete process.env.SOCIAL_WEBHOOK_URL;
    const res = await socialPublisher.dispatchToWebhook({ campaignId: 'CMP-TEST' });
    assert.strictEqual(res.dispatched, false);
    assert.strictEqual(res.reason, 'no_social_webhook_configured');
  });

  await check('publish-social responde GET con estado y ejemplo', async () => {
    const res = await publishSocialHandler.handler({ httpMethod: 'GET' });
    assert.strictEqual(res.statusCode, 200);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.status, 'active');
    assert.ok(Array.isArray(data.targetPlatformsSupported));
  });

  console.log('\nRespuesta ante errores de pasarela');
  const stripeError = (type, code) => ({ type: type, code: code, message: 'detalle interno sk_test_secreto' });
  const silently = (fn) => {
    const original = console.error;
    console.error = () => {};
    try {
      return fn();
    } finally {
      console.error = original;
    }
  };

  await check('clave de Stripe inválida -> payment_gateway_misconfigured', () => {
    const res = silently(() => commerce.errorResponse(stripeError('StripeAuthenticationError', 'api_key_invalid')));
    assert.strictEqual(res.statusCode, 500);
    assert.strictEqual(JSON.parse(res.body).code, 'payment_gateway_misconfigured');
  });
  await check('otro error de Stripe -> payment_gateway_error', () => {
    const res = silently(() => commerce.errorResponse(stripeError('StripeInvalidRequestError', 'parameter_invalid')));
    assert.strictEqual(res.statusCode, 500);
    assert.strictEqual(JSON.parse(res.body).code, 'payment_gateway_error');
  });
  await check('el error de parámetro indica el campo rechazado', () => {
    const failure = stripeError('StripeInvalidRequestError', 'parameter_invalid_integer');
    failure.param = 'line_items[0].price_data.unit_amount';
    const res = silently(() => commerce.errorResponse(failure));
    const body = JSON.parse(res.body);
    assert.strictEqual(body.gateway_code, 'parameter_invalid_integer');
    assert.strictEqual(body.gateway_param, 'line_items[0].price_data.unit_amount');
  });
  await check('el error de pasarela no filtra detalles internos', () => {
    const res = silently(() => commerce.errorResponse(stripeError('StripeAuthenticationError', 'api_key_invalid')));
    assert.ok(!/sk_test|Stripe|api_key_invalid/.test(res.body), 'la respuesta filtra detalles internos');
  });
  await check('un error no controlado sigue siendo internal_error', () => {
    const res = silently(() => commerce.errorResponse(new Error('boom')));
    assert.strictEqual(res.statusCode, 500);
    assert.strictEqual(JSON.parse(res.body).code, 'internal_error');
  });

  console.log('\n' + passed + ' comprobaciones correctas, ' + failures.length + ' fallos');
  if (failures.length) {
    console.log('\nFallos:');
    failures.forEach((line) => console.log(' - ' + line));
    process.exit(1);
  }
  console.log('Backend de tienda verificado.\n');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
