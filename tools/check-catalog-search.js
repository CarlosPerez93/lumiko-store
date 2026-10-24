/* Comprobación temporal: semántica de búsqueda sin acentos sobre el snapshot real. */
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'src', 'app', 'core', 'catalog', 'data', 'alibaba.products.ts');
let src = fs.readFileSync(file, 'utf8');
src = src.slice(src.indexOf('export const ALIBABA_PRODUCTS'));
src = src.slice(src.indexOf('['), src.lastIndexOf(']') + 1);
const rows = eval(src); // snapshot generado, sin lógica ejecutable

const fold = (v) =>
  (v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const text = (row) =>
  [
    row.name,
    row.tagline,
    row.description,
    row.audience,
    (row.features || []).join(' '),
    row.supplier && row.supplier.name,
  ].join(' ');

function count(query) {
  const tokens = fold(query).trim().split(/\s+/).filter(Boolean);
  const hits = rows.filter((row) => {
    const hay = fold(text(row));
    return tokens.every((t) => hay.indexOf(t) !== -1);
  });
  return { query, total: hits.length, sample: hits.slice(0, 3).map((h) => h.name) };
}

console.log('productos:', rows.length);
['lampara', 'lámpara', 'lampara anime', 'neon', 'robot', 'pinguino', 'proyector'].forEach((q) =>
  console.log(JSON.stringify(count(q)))
);
