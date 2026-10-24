/**
 * Verificación del despliegue de LUMIKO.
 *
 * Uso:
 *   node tools/verify-production.js                       # https://lumiko-store.netlify.app
 *   node tools/verify-production.js https://mi-dominio    # otro destino
 *
 * Comprueba, contra el sitio real:
 *   1. Que la SPA responde en todas las rutas (incluida la recarga profunda).
 *   2. Que los ficheros estáticos se sirven.
 *   3. Que las cabeceras de seguridad están puestas.
 *   4. Que las Functions existen y validan sus entradas.
 *   5. Que el checkout responde 503 (sin claves) o 200 (con claves).
 *
 * No necesita credenciales. Sale con código 1 si algo falla.
 */
const BASE = (process.argv[2] || 'https://lumiko-store.netlify.app').replace(/\/+$/, '');

let passed = 0;
const failures = [];

function check(name, condition, detail) {
  if (condition) {
    passed += 1;
    console.log('  ok   ' + name);
  } else {
    failures.push(name + (detail ? ' -> ' + detail : ''));
    console.log('  FAIL ' + name + (detail ? ' -> ' + detail : ''));
  }
}

async function get(path, options) {
  // El build sirve los assets con rutas relativas ("main-es2017.js"), así que
  // hay que normalizarlas antes de concatenar.
  const relative = path.charAt(0) === '/' || /^https?:\/\//.test(path) ? path : '/' + path;
  const response = await fetch(BASE + relative, Object.assign({ redirect: 'follow' }, options || {}));
  const body = await response.text();
  return { status: response.status, headers: response.headers, body };
}

const SPA_ROUTES = ['/', '/catalogo', '/carrito', '/checkout', '/pedido', '/404', '/producto/pantalla-pixel-24-48'];

async function verifyShell() {
  console.log('\n1. SPA y rutas');
  for (const route of SPA_ROUTES) {
    const response = await get(route);
    check(
      'GET ' + route + ' -> 200 html',
      response.status === 200 && /<app-root/i.test(response.body),
      'status ' + response.status
    );
  }

  const deep = await get('/producto/no-existe-esta-referencia');
  check('ruta inexistente sirve la app (404 del router)', deep.status === 200 && /<app-root/i.test(deep.body), 'status ' + deep.status);

  const assets = (await get('/')).body.match(/src="([^"]*main[^"]*\.js)"/) || [];
  if (assets[1]) {
    const script = await get(assets[1]);
    check('bundle principal accesible', script.status === 200 && script.body.length > 1000, 'status ' + script.status);
  } else {
    check('bundle principal referenciado en el html', false, 'no se encontro <script src="...main...">');
  }

  const styles = (await get('/')).body.match(/href="([^"]*styles[^"]*\.css)"/) || [];
  if (styles[1]) {
    const css = await get(styles[1]);
    check('hoja de estilos accesible', css.status === 200 && css.body.length > 1000, 'status ' + css.status);
  } else {
    check('hoja de estilos referenciada en el html', false, 'no se encontro <link href="...styles...css">');
  }

  const favicon = await get('/assets/favicon.svg');
  check('favicon servido', favicon.status === 200, 'status ' + favicon.status);
}

async function verifyHeaders() {
  console.log('\n2. Cabeceras y cache');
  const response = await get('/');
  check('x-content-type-options: nosniff', response.headers.get('x-content-type-options') === 'nosniff', String(response.headers.get('x-content-type-options')));
  check('x-frame-options: DENY', (response.headers.get('x-frame-options') || '').toUpperCase() === 'DENY', String(response.headers.get('x-frame-options')));
  check('referrer-policy presente', !!response.headers.get('referrer-policy'), 'ausente');
  check('permissions-policy presente', !!response.headers.get('permissions-policy'), 'ausente');
  check('https servido por netlify', !!response.headers.get('x-nf-request-id') || BASE.indexOf('https://') === 0, 'sin cabecera de netlify');
}

async function verifyFunctions() {
  console.log('\n3. Netlify Functions');

  const createGet = await get('/.netlify/functions/create-checkout-session');
  check('create-checkout-session rechaza GET (405)', createGet.status === 405, 'status ' + createGet.status);
  check('create-checkout-session no cachea', (createGet.headers.get('cache-control') || '').indexOf('no-store') !== -1, String(createGet.headers.get('cache-control')));
  check('respuesta JSON', (createGet.headers.get('content-type') || '').indexOf('application/json') !== -1, String(createGet.headers.get('content-type')));

  const badJson = await get('/.netlify/functions/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{esto no es json'
  });
  check('create-checkout-session rechaza JSON invalido (400)', badJson.status === 400 && /invalid_json/.test(badJson.body), 'status ' + badJson.status + ' ' + badJson.body.slice(0, 120));

  const emptyCart = await get('/.netlify/functions/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [], customer: {} })
  });
  check('create-checkout-session rechaza carrito vacio (400)', emptyCart.status === 400 && /empty_cart/.test(emptyCart.body), 'status ' + emptyCart.status + ' ' + emptyCart.body.slice(0, 120));

  const unknownProduct = await get('/.netlify/functions/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ id: 'producto-que-no-existe', qty: 1 }],
      customer: { name: 'Prueba Real', email: 'prueba@lumiko.test', address: 'Calle Mayor 1', city: 'Madrid', postalCode: '28001', country: 'España' }
    })
  });
  check('create-checkout-session rechaza producto desconocido (409)', unknownProduct.status === 409 && /unknown_product/.test(unknownProduct.body), 'status ' + unknownProduct.status + ' ' + unknownProduct.body.slice(0, 120));

  const invalidCountry = await get('/.netlify/functions/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ id: 'pantalla-pixel-24-48', qty: 1 }],
      customer: { name: 'Prueba Real', email: 'prueba@lumiko.test', address: 'Calle Mayor 1', city: 'Madrid', postalCode: '28001', country: 'Japon' }
    })
  });
  check('create-checkout-session rechaza pais no cubierto (400)', invalidCountry.status === 400 && /invalid_country/.test(invalidCountry.body), 'status ' + invalidCountry.status + ' ' + invalidCountry.body.slice(0, 120));

  const validOrder = await get('/.netlify/functions/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ id: 'pantalla-pixel-24-48', qty: 1 }],
      customer: { name: 'Prueba Real', email: 'prueba@lumiko.test', address: 'Calle Mayor 1', city: 'Madrid', postalCode: '28001', country: 'España' }
    })
  });
  if (validOrder.status === 200) {
    const payload = JSON.parse(validOrder.body || '{}');
    check('checkout real devuelve url de Stripe', /^cs_/.test(String(payload.id)) && /^https:\/\/checkout\.stripe\.com\//.test(String(payload.url)), 'id ' + payload.id);
  } else if (validOrder.status === 503) {
    check('checkout sin claves responde 503 payments_not_configured', /payments_not_configured/.test(validOrder.body), validOrder.body.slice(0, 160));
  } else {
    check('checkout responde 200 o 503', false, 'status ' + validOrder.status + ' ' + validOrder.body.slice(0, 160));
  }

  // El comprador nunca debe ver nombres de variables de entorno ni rutas internas.
  check(
    'los errores no filtran detalles tecnicos',
    !/STRIPE_[A-Z_]+|process\.env|netlify\/functions/i.test(validOrder.body),
    validOrder.body.slice(0, 160)
  );

  const orderNoId = await get('/.netlify/functions/get-order');
  check('get-order exige session_id (400)', orderNoId.status === 400, 'status ' + orderNoId.status);

  const orderBadId = await get('/.netlify/functions/get-order?session_id=../../etc/passwd');
  check('get-order rechaza id malformado (400)', orderBadId.status === 400, 'status ' + orderBadId.status);

  const orderPost = await get('/.netlify/functions/get-order', { method: 'POST', body: '{}' });
  check('get-order rechaza POST (405)', orderPost.status === 405, 'status ' + orderPost.status);

  const webhookGet = await get('/.netlify/functions/stripe-webhook');
  check('stripe-webhook rechaza GET (405)', webhookGet.status === 405, 'status ' + webhookGet.status);

  const webhookUnsigned = await get('/.netlify/functions/stripe-webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"type":"checkout.session.completed"}'
  });
  check(
    'stripe-webhook sin firma no procesa el evento',
    webhookUnsigned.status === 400 || webhookUnsigned.status === 503,
    'status ' + webhookUnsigned.status + ' ' + webhookUnsigned.body.slice(0, 160)
  );
}

async function verifySeo() {
  console.log('\n4. Metadatos');
  const home = (await get('/')).body;
  check('title de la tienda', /<title>[^<]*LUMIKO/i.test(home), 'sin title');
  check('meta description', /name="description"/i.test(home), 'sin description');
  check('viewport para responsive', /name="viewport"/i.test(home), 'sin viewport');
  check('lang es', /<html[^>]*lang="es"/i.test(home), 'sin lang');
}

(async function main() {
  console.log('Verificando ' + BASE);
  try {
    await verifyShell();
    await verifyHeaders();
    await verifyFunctions();
    await verifySeo();
  } catch (error) {
    failures.push('excepcion: ' + (error && error.message ? error.message : error));
    console.error('\nError inesperado:', error && error.stack ? error.stack : error);
  }

  console.log('\n' + passed + ' comprobaciones correctas, ' + failures.length + ' fallos');
  if (failures.length) {
    console.log('\nFallos:');
    for (const failure of failures) {
      console.log(' - ' + failure);
    }
    process.exit(1);
  }
  console.log('Despliegue verificado.');
})();
