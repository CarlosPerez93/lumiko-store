/**
 * Exporta el catálogo real a un snapshot JSON que consumen las Netlify Functions.
 *
 * El navegador nunca decide el precio: el servidor recalcula el importe a partir
 * de este snapshot, generado con la MISMA política de precios (pricing.ts) que
 * usa la web. Ejecutar con `npm run catalog:export` antes de cada deploy.
 */
const fs = require('fs');
const path = require('path');
const Module = require('module');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const OUT = path.join(root, 'netlify', 'functions', '_lib', 'catalog.json');

/** Carga un módulo TypeScript sin compilar el proyecto entero. */
function loadTs(relativePath) {
  const file = path.join(root, relativePath);
  const source = fs.readFileSync(file, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
      esModuleInterop: true
    },
    fileName: file
  }).outputText;

  const mod = new Module(file, module);
  mod.filename = file;
  mod.paths = Module._nodeModulePaths(path.dirname(file));
  mod._compile(output, file);
  return mod.exports;
}

const { ALIBABA_PRODUCTS } = loadTs('src/app/core/catalog/data/alibaba.products.ts');
const { retailPrice, PRICING_POLICY } = loadTs('src/app/core/catalog/pricing.ts');

if (!Array.isArray(ALIBABA_PRODUCTS) || !ALIBABA_PRODUCTS.length) {
  throw new Error('El snapshot de proveedores está vacío: no hay nada que exportar.');
}

const seen = {};
const products = [];

for (const row of ALIBABA_PRODUCTS) {
  if (seen[row.id]) {
    continue;
  }
  seen[row.id] = true;
  const price = retailPrice(row.supplierPriceMin, row.supplierPriceMax);
  products.push({
    id: row.id,
    name: row.name,
    description: String(row.tagline || row.name).slice(0, 260),
    category: row.category,
    // Importe final en céntimos, con IVA incluido (igual que en la ficha).
    unitAmount: Math.round(price * 100),
    currency: 'eur',
    sourceId: row.sourceId,
    sourceLabel: row.sourceLabel,
    supplierName: row.supplier.name,
    supplierCountry: row.supplier.country,
    supplierUrl: row.buyUrl
  });
}

const snapshot = {
  generatedAt: new Date().toISOString().slice(0, 10),
  currency: 'eur',
  pricingPolicy: PRICING_POLICY,
  shipping: { freeThreshold: 4900, cost: 495, currency: 'eur' },
  coupons: { LUMI10: 10, ANIME15: 15 },
  products
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + '\n', 'utf8');

console.log(
  'catálogo exportado: ' + products.length + ' productos -> ' +
    path.relative(root, OUT) + ' (' + snapshot.generatedAt + ')'
);
