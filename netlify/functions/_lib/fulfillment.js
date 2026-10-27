/**
 * Módulo de automatización de despacho y órdenes de compra a proveedores.
 *
 * Al confirmarse un pago en Stripe (stripe-webhook.js), este módulo:
 * 1. Resuelve los productos cobrados contra el catálogo real de proveedores (Alibaba/ABYstyle).
 * 2. Extrae la dirección física de envío y los datos del cliente comprador.
 * 3. Calcula el desglose financiero exacto:
 *    - PVP cobrado al cliente en LUMIKO.
 *    - Coste estimado de compra al proveedor tercero.
 *    - Margen bruto y beneficio retenido en la tienda.
 * 4. Genera una Orden de Compra/Despacho lista para tramitar:
 *    - Enlace directo al producto del fabricante (buyUrl).
 *    - Referencia original del proveedor (sourceId).
 *    - Datos completos de envío formateados para el proveedor.
 * 5. Si está configurada la variable FULFILLMENT_WEBHOOK_URL, despacha la orden vía HTTP POST
 *    en formato JSON para su tramitación automática en sistemas externos (Make, Zapier, ERP o bot).
 */
const https = require('https');
const http = require('http');
const url = require('url');
const catalog = require('./catalog.json');

/** Mapa indexado de productos por ID para búsqueda O(1). */
const productMap = new Map();
for (const p of catalog.products || []) {
  productMap.set(p.id, p);
}

/**
 * Parsea los items comprados a partir de los metadatos de Stripe.
 * Soporta metadatos simples (items) y particionados (items_1, items_2...).
 */
function parseItemsFromMetadata(metadata) {
  if (!metadata) return [];
  const tokens = [];

  if (metadata.items) {
    tokens.push(...metadata.items.split(','));
  }

  for (let i = 1; i <= 10; i++) {
    const chunk = metadata['items_' + i];
    if (chunk) {
      tokens.push(...chunk.split(','));
    }
  }

  const items = [];
  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(':');
    const id = parts[0];
    const qty = parseInt(parts[1], 10) || 1;
    if (id) {
      items.push({ id, qty });
    }
  }

  return items;
}

/**
 * Normaliza la dirección de envío del cliente para el proveedor.
 */
function extractShippingAddress(session) {
  const meta = session.metadata || {};
  const shipping = session.shipping_details || session.customer_details || {};
  const addr = shipping.address || {};

  const name = shipping.name || meta.customer_name || 'Cliente LUMIKO';
  const line1 = addr.line1 || meta.customer_address || '';
  const line2 = addr.line2 || '';
  const city = addr.city || '';
  const state = addr.state || '';
  const postalCode = addr.postal_code || '';
  const country = addr.country || 'ES';
  const email = session.customer_email || (session.customer_details && session.customer_details.email) || '';
  const phone = (shipping.phone || (session.customer_details && session.customer_details.phone)) || '';

  const fullStreet = [line1, line2].filter(Boolean).join(', ');
  const formattedLines = [
    `Destinatario: ${name}`,
    phone ? `Teléfono: ${phone}` : null,
    `Dirección: ${fullStreet}`,
    `Ciudad / CP: ${city} ${postalCode}`,
    state ? `Provincia / Estado: ${state}` : null,
    `País: ${country}`,
    email ? `Email: ${email}` : null
  ].filter(Boolean).join('\n');

  return {
    recipientName: name,
    phone: phone || null,
    email: email || null,
    streetAddress: fullStreet,
    city: city || null,
    stateProvince: state || null,
    postalCode: postalCode || null,
    countryCode: country,
    formattedBlock: formattedLines
  };
}

/**
 * Construye la orden de compra a proveedores (Fulfillment Order).
 */
function buildFulfillmentOrder(session) {
  const meta = session.metadata || {};
  const reference = meta.reference || session.client_reference_id || session.id;
  const rawItems = parseItemsFromMetadata(meta);

  let totalRetailCents = 0;
  let totalSupplierCostCents = 0;
  const items = [];

  for (const item of rawItems) {
    const prod = productMap.get(item.id);
    if (!prod) {
      items.push({
        id: item.id,
        name: 'Producto desconocido (' + item.id + ')',
        qty: item.qty,
        unitRetailEur: 0,
        totalRetailEur: 0,
        supplier: null
      });
      continue;
    }

    const unitRetail = (prod.unitAmount || 0) / 100;
    const lineRetail = unitRetail * item.qty;
    totalRetailCents += (prod.unitAmount || 0) * item.qty;

    // Coste unitario estimado del proveedor (en EUR)
    const unitCost = prod.supplierPriceMax || prod.supplierPriceMin || 0;
    const lineCost = unitCost * item.qty;
    totalSupplierCostCents += Math.round(unitCost * 100) * item.qty;

    const lineProfit = lineRetail - lineCost;
    const lineMarginPct = lineRetail > 0 ? Math.round((lineProfit / lineRetail) * 100) : 0;

    items.push({
      productId: prod.id,
      productName: prod.name,
      category: prod.category,
      quantity: item.qty,
      unitRetailEur: unitRetail,
      totalRetailEur: Math.round(lineRetail * 100) / 100,
      estimatedUnitCostEur: unitCost,
      estimatedTotalCostEur: Math.round(lineCost * 100) / 100,
      estimatedProfitEur: Math.round(lineProfit * 100) / 100,
      marginPercent: lineMarginPct,
      supplier: {
        platform: prod.sourceLabel || 'Alibaba.com',
        supplierName: prod.supplierName || 'Proveedor',
        supplierCountry: prod.supplierCountry || 'CN',
        sourceId: prod.sourceId,
        buyUrl: prod.supplierUrl,
        moq: prod.supplierMoq || 1,
        unit: prod.supplierUnit || 'unidad'
      }
    });
  }

  const chargedEur = typeof session.amount_total === 'number' ? session.amount_total / 100 : totalRetailCents / 100;
  const supplierCostEur = Math.round(totalSupplierCostCents) / 100;
  const grossProfitEur = Math.round((chargedEur - supplierCostEur) * 100) / 100;
  const profitMarginPct = chargedEur > 0 ? Math.round((grossProfitEur / chargedEur) * 100) : 0;

  const shipping = extractShippingAddress(session);

  return {
    orderReference: reference,
    stripeSessionId: session.id,
    createdAt: new Date().toISOString(),
    status: 'ready_for_supplier_purchase',
    financials: {
      chargedToCustomerEur: chargedEur,
      estimatedSupplierCostEur: supplierCostEur,
      estimatedGrossProfitEur: grossProfitEur,
      grossProfitMarginPercent: profitMarginPct,
      currency: (session.currency || 'eur').toUpperCase()
    },
    customerShipping: shipping,
    purchaseList: items,
    actionsSummary: items.map((it, idx) => ({
      step: idx + 1,
      action: `Comprar ${it.quantity}x "${it.productName}" en ${it.supplier ? it.supplier.platform : 'Proveedor'}`,
      supplierUrl: it.supplier ? it.supplier.buyUrl : null,
      supplierName: it.supplier ? it.supplier.supplierName : null,
      targetShipping: `${shipping.recipientName}, ${shipping.streetAddress}, ${shipping.city} (${shipping.countryCode})`
    }))
  };
}

/**
 * Despacha la orden de compra automáticamente:
 * 1. Log estructurado en consola (Netlify Functions Log / Datadog).
 * 2. Envío HTTP POST si FULFILLMENT_WEBHOOK_URL está configurada.
 */
async function dispatchFulfillmentOrder(fulfillmentOrder) {
  // 1. Log estructurado
  console.log(
    '[lumiko-fulfillment] ORDEN GENERADA:',
    JSON.stringify({
      ref: fulfillmentOrder.orderReference,
      session: fulfillmentOrder.stripeSessionId,
      charged: fulfillmentOrder.financials.chargedToCustomerEur,
      cost: fulfillmentOrder.financials.estimatedSupplierCostEur,
      profit: fulfillmentOrder.financials.estimatedGrossProfitEur,
      itemsCount: fulfillmentOrder.purchaseList.length,
      customer: fulfillmentOrder.customerShipping.recipientName,
      country: fulfillmentOrder.customerShipping.countryCode
    })
  );

  const webhookUrl = (process.env.FULFILLMENT_WEBHOOK_URL || '').trim();
  if (!webhookUrl) {
    return {
      dispatched: false,
      reason: 'no_webhook_configured',
      note: 'Orden registrada en logs del servidor. Configura FULFILLMENT_WEBHOOK_URL para reenvío automático a un endpoint externo.'
    };
  }

  // 2. Envío a webhook externo
  return new Promise((resolve) => {
    try {
      const parsed = url.parse(webhookUrl);
      const isHttps = parsed.protocol === 'https:';
      const transport = isHttps ? https : http;

      const payload = JSON.stringify({
        event: 'order.fulfillment_ready',
        timestamp: new Date().toISOString(),
        data: fulfillmentOrder
      });

      const options = {
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.path || '/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'User-Agent': 'LUMIKO-Fulfillment-Bot/1.0',
          'X-Lumiko-Order-Ref': fulfillmentOrder.orderReference
        },
        timeout: 10000
      };

      const req = transport.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          console.log(`[lumiko-fulfillment] webhook respuesta HTTP ${res.statusCode} para ref ${fulfillmentOrder.orderReference}`);
          resolve({
            dispatched: res.statusCode >= 200 && res.statusCode < 300,
            statusCode: res.statusCode,
            responseSnippet: body.slice(0, 200)
          });
        });
      });

      req.on('error', (err) => {
        console.error('[lumiko-fulfillment] error enviando webhook:', err.message);
        resolve({
          dispatched: false,
          error: err.message
        });
      });

      req.on('timeout', () => {
        req.destroy();
        console.warn('[lumiko-fulfillment] timeout enviando webhook a', webhookUrl);
        resolve({
          dispatched: false,
          error: 'timeout'
        });
      });

      req.write(payload);
      req.end();
    } catch (err) {
      console.error('[lumiko-fulfillment] excepción en webhook:', err.message);
      resolve({
        dispatched: false,
        error: err.message
      });
    }
  });
}

module.exports = {
  buildFulfillmentOrder,
  dispatchFulfillmentOrder,
  extractShippingAddress,
  parseItemsFromMetadata
};
