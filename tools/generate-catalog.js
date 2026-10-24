/**
 * Generador del snapshot de catalogo (proveedor Alibaba.com).
 *
 * Entradas:
 *   tools/data/batch-a.json, tools/data/batch-b.json  -> respuestas crudas de batchQueryProducts
 *   tools/data/editorial.json                         -> curaduria (nombre comercial, textos, categoria)
 *
 * Salida:
 *   src/app/core/catalog/data/alibaba.products.ts     -> SupplierProduct[] tipado
 *
 * No se inventa ningun dato comercial: precio, MOQ, imagenes, valoracion, plazo,
 * proveedor y enlace de compra se copian tal cual de la respuesta del proveedor.
 *
 * Uso: npm run catalog:build
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(__dirname, 'data');
const OUT = path.join(ROOT, 'src', 'app', 'core', 'catalog', 'data', 'alibaba.products.ts');

const CATEGORIES = ['lamparas', 'robots', 'proyeccion', 'gaming'];

function readJson(file) {
  const raw = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  const start = raw.indexOf('{"success"');
  return JSON.parse(start >= 0 ? raw.slice(start) : raw);
}

/** "2,58-2,98 €" -> { min: 2.58, max: 2.98 } */
function parsePriceRange(value) {
  const nums = String(value || '')
    .replace(/[^\d,.\-]/g, '')
    .split('-')
    .map((part) => Number(part.replace(/\./g, '').replace(',', '.')))
    .filter((n) => !Number.isNaN(n));
  if (!nums.length) {
    return null;
  }
  return { min: Math.min.apply(null, nums), max: Math.max.apply(null, nums) };
}

function parseQty(value) {
  const match = String(value || '').match(/\d+/);
  return match ? Number(match[0]) : 1;
}

function parseJsonArray(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function absolute(url) {
  if (!url) {
    return '';
  }
  return url.indexOf('//') === 0 ? 'https:' + url : url;
}

function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function yearsFromLabel(value) {
  const match = String(value || '').match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function build() {
  const editorial = JSON.parse(fs.readFileSync(path.join(DATA, 'editorial.json'), 'utf8'));
  const editorialById = {};
  for (const entry of editorial.products) {
    editorialById[entry.id] = entry;
  }

  const batches = [
    { file: 'batch-a.json', payload: readJson(path.join(DATA, 'batch-a.json')) },
    { file: 'batch-b.json', payload: readJson(path.join(DATA, 'batch-b.json')) }
  ];

  const products = [];
  const seen = {};
  const usedSlugs = {};
  const problems = [];

  for (const batch of batches) {
    for (const row of batch.payload.data) {
      const id = String(row.productId);
      if (seen[id]) {
        continue;
      }
      seen[id] = true;

      const copy = editorialById[id];
      if (!copy) {
        problems.push('Sin ficha editorial: ' + id + ' (' + row.productName + ')');
        continue;
      }
      if (CATEGORIES.indexOf(copy.cat) === -1) {
        problems.push('Categoria invalida en ' + id + ': ' + copy.cat);
        continue;
      }

      const range = parsePriceRange(row.price || row.promotionPrice);
      if (!range) {
        problems.push('Precio ilegible en ' + id + ': ' + row.price);
        continue;
      }

      const images = parseJsonArray(row.picUrl).map(absolute).filter(Boolean);
      if (!images.length) {
        problems.push('Sin imagenes en ' + id);
        continue;
      }

      let slug = slugify(copy.name);
      if (usedSlugs[slug]) {
        usedSlugs[slug] += 1;
        slug = slug + '-' + usedSlugs[slug];
      } else {
        usedSlugs[slug] = 1;
      }

      const quantityPrices = parseJsonArray(row.quantityPrices)
        .map((tier) => {
          const tierRange = parsePriceRange(tier.price);
          return tierRange
            ? {
                minQty: Number(tier.quantityMin) || 1,
                maxQty: Number(tier.quantityMax) > 0 ? Number(tier.quantityMax) : null,
                price: tierRange.min
              }
            : null;
        })
        .filter(Boolean);

      products.push({
        id: slug,
        sourceId: id,
        sourceLabel: row.dataSource || 'Alibaba.com',
        supplier: {
          id: String(row.companyId || ''),
          name: row.companyName || '',
          country: row.country || '',
          verified: String(row.verified) === 'true',
          rating: Number(row.reviewScore) || 0,
          yearsActive: yearsFromLabel(row.year),
          businessType: row.supplierType || '',
          sold180: Number(row.prodSold180) || 0,
          deliveryRate: Number(row.deliveryRate) || 0,
          delivery: row.delivery || ''
        },
        title: row.productName || '',
        name: copy.name,
        tagline: copy.tag,
        description: copy.desc,
        features: copy.feats || [],
        audience: copy.audience || '',
        category: copy.cat,
        images: images,
        buyUrl: row.productUrl || '',
        videoUrl: row.videoUrl || '',
        moq: parseQty(row.moq),
        moqLabel: row.moq || '',
        unit: row.unit || '',
        supplierPriceMin: range.min,
        supplierPriceMax: range.max,
        currency: 'EUR',
        quantityPrices: quantityPrices,
        reviewsScore: Number(row.reviewScore) || 0
      });
    }
  }

  if (problems.length) {
    console.error('Errores de integridad del catalogo:');
    problems.forEach((p) => console.error(' - ' + p));
    process.exit(1);
  }

  const missing = Object.keys(editorialById).filter((id) => !seen[id]);
  if (missing.length) {
    console.error('Fichas editoriales sin producto de proveedor: ' + missing.join(', '));
    process.exit(1);
  }

  products.sort((a, b) => a.category.localeCompare(b.category) || b.supplier.sold180 - a.supplier.sold180);

  const header = [
    '/* eslint-disable */',
    '// ARCHIVO GENERADO — no editar a mano.',
    '// Origen: tools/generate-catalog.js a partir de tools/data/batch-*.json + editorial.json',
    '// Regenerar con: npm run catalog:build',
    '// Proveedor: ' + products[0].sourceLabel + ' · productos: ' + products.length,
    '',
    "import { SupplierProduct } from '../supplier-product.model';",
    '',
    'export const ALIBABA_SOURCE_META = {',
    "  id: 'alibaba',",
    "  label: 'Alibaba.com',",
    "  region: 'CN',",
    "  kind: 'marketplace',",
    '  products: ' + products.length + ',',
    '  generatedAt: ' + JSON.stringify(new Date().toISOString().slice(0, 10)),
    '};',
    '',
    'export const ALIBABA_PRODUCTS: SupplierProduct[] = '
  ].join('\n');

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, header + JSON.stringify(products, null, 2) + ';\n', 'utf8');

  const verified = products.filter((p) => p.supplier.verified).length;
  const suppliers = new Set(products.map((p) => p.supplier.id)).size;
  console.log('OK ' + products.length + ' productos · ' + suppliers + ' proveedores · ' + verified + ' verificados');
  console.log('-> ' + path.relative(ROOT, OUT));
}

build();
