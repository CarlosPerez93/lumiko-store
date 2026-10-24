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
const createSession = require(path.join(libDir, 'create-checkout-session.js'));
const getOrder = require(path.join(libDir, 'get-order.js'));
const webhook = require(path.join(libDir, 'stripe-webhook.js'));

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
  await check('hay 24 productos en el snapshot', () => assert.strictEqual(products.length, 24));
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
