/* eslint-disable */
// Snapshot curado del proveedor europeo ABYstyle (Abysse Corp, Francia).
//
// Origen: fichas publicas de https://www.abystyle.com (categoria lamparas),
// consultadas el 2026-10-24. No es un archivo generado: son 12 referencias
// verificadas una a una (referencia ABYLIG, EAN, PVP, disponibilidad y medidas).
//
// Particularidad frente a Alibaba.com: ABYstyle es un DISTRIBUIDOR, no un
// mayorista. Publica PVP, no coste de compra, por eso esta fuente declara su
// propia politica de precios (RETAIL_PURCHASE_POLICY). Ver pricing.ts.
import { RETAIL_PURCHASE_POLICY } from '../pricing';
import { ProductSourceMeta, SupplierProduct } from '../supplier-product.model';

/**
 * Ficha publica del proveedor.
 *
 * NO se inventan metricas de marketplace: ABYstyle no publica "vendidos 180 d"
 * ni "tasa de entrega", asi que esos campos van a 0 y las plantillas los
 * ocultan. La valoracion es la real de Trustpilot (3,3/5, 74 opiniones), no una
 * nota interna del producto.
 */
const ABYSTYLE_SUPPLIER = {
  id: 'abystyle',
  name: 'ABYstyle · Abysse Corp',
  country: 'FR',
  verified: false,
  rating: 3.3,
  yearsActive: 0,
  businessType: 'retailer',
  sold180: 0,
  deliveryRate: 0,
  // No publica plazo comprometido por referencia; la disponibilidad real es
  // "En stock", que se declara en cada producto.
  delivery: ''
};

/** Construye una fila con la forma exacta del contrato de proveedor. */
function lamp(config: {
  id: string;
  ref: string;
  name: string;
  title: string;
  tagline: string;
  description: string;
  features: string[];
  audience: string;
  price: number;
  categoryPath: string;
  slug: string;
  imageIds: number[];
  videoUrl?: string;
}): SupplierProduct {
  return {
    id: config.id,
    sourceId: config.ref,
    sourceLabel: 'ABYstyle',
    supplier: { ...ABYSTYLE_SUPPLIER },
    title: config.title,
    name: config.name,
    tagline: config.tagline,
    description: config.description,
    features: config.features,
    audience: config.audience,
    category: 'lamparas',
    images: config.imageIds.map(
      (id) => 'https://www.abystyle.com/' + id + '-home_default/' + config.slug + '.jpg'
    ),
    buyUrl: 'https://www.abystyle.com/es/' + config.categoryPath + '/' + config.slug + '.html',
    videoUrl: config.videoUrl || '',
    // Se compra de una en una: es distribucion minorista, no hay MOQ de fabrica.
    moq: 1,
    moqLabel: '1 unidad',
    unit: 'unidad',
    supplierPriceMin: config.price,
    supplierPriceMax: config.price,
    currency: 'EUR',
    quantityPrices: [{ minQty: 1, maxQty: null, price: config.price }],
    // ABYstyle marca "En stock" las 12 referencias.
    availability: 'disponible'
  };
}

export const ABYSTYLE_PRODUCTS: SupplierProduct[] = [
  lamp({
    id: 'abystyle-one-piece-gear-5th',
    ref: 'ABYLIG029E',
    name: 'Lámpara Gear 5th — One Piece',
    title: 'ONE PIECE Lampe Gear 5th',
    tagline: 'Luffy en su despertar Gear 5th, iluminado desde dentro.',
    description:
      'Lámpara de sobremesa con la silueta de Monkey D. Luffy en Gear 5th. Se ilumina desde el interior y proyecta un halo sobre la pared, con ranura trasera para colgarla. Producto oficial de One Piece distribuido por ABYstyle en Europa.',
    features: [
      'Iluminación interior con halo proyectado',
      'Funciona con 3 pilas AA (no incluidas)',
      'Ranura trasera para colgar en pared',
      'Medidas: 17 × 17,4 × 6 cm'
    ],
    audience: 'Fans de One Piece',
    price: 24.99,
    categoryPath: 'one-piece',
    slug: 'one-piece-lampe-gear-5th',
    imageIds: [14525086, 14525087, 14525088, 14525089, 14525090]
  }),
  lamp({
    id: 'abystyle-naruto-konoha',
    ref: 'ABYLIG025E',
    name: 'Lámpara Konoha — Naruto Shippuden',
    title: 'NARUTO SHIPPUDEN Lampe Konoha',
    tagline: 'El símbolo de la Aldea de la Hoja en versión lámpara de pared.',
    description:
      'Lámpara con el emblema de la Aldea Oculta de la Hoja. Luz cálida pensada para escritorio o pared: incluye ranura trasera para colgarla. Referencia oficial de Naruto Shippuden distribuida por ABYstyle en Europa.',
    features: [
      'Emblema de Konoha iluminado',
      'Funciona con 3 pilas AA (no incluidas)',
      'Ranura trasera para colgar en pared',
      'Medidas: 21 × 16 × 6 cm'
    ],
    audience: 'Fans de Naruto Shippuden',
    price: 24.99,
    categoryPath: 'naruto',
    slug: 'naruto-shippuden-lampe-konoha',
    imageIds: [14525075, 14525076, 14525077, 14525078, 14525079]
  }),
  lamp({
    id: 'abystyle-death-note-l',
    ref: 'ABYLIG023E',
    name: 'Lámpara L — Death Note',
    title: 'DEATH NOTE Lampe L',
    tagline: 'La silueta de L en su pose de dedo, como luz de escritorio.',
    description:
      'Lámpara inspirada en L, el detective de Death Note, en su característica postura. Iluminación interior y ranura trasera para colgarla. Producto oficial de Death Note distribuido por ABYstyle en Europa.',
    features: [
      'Silueta de L con iluminación interior',
      'Funciona con 3 pilas AAA (no incluidas)',
      'Ranura trasera para colgar en pared',
      'Medidas: 21 × 18,1 × 6 cm'
    ],
    audience: 'Fans de Death Note',
    price: 24.99,
    categoryPath: 'death-note',
    slug: 'death-note-lampe-l',
    imageIds: [9550471, 9550472, 9550473, 9550474, 9550475]
  }),
  lamp({
    id: 'abystyle-one-piece-chapeau-de-paille',
    ref: 'ABYLIG021E',
    name: 'Lámpara Sombrero de Paja 3D — One Piece',
    title: 'ONE PIECE Lampe Chapeau de Paille',
    tagline: 'El sombrero de Luffy en volumen, para colgar en pared.',
    description:
      'Lámpara 3D con forma del icónico sombrero de paja de los Piratas de Sombrero de Paja. Pieza de mayor tamaño dentro de la colección, pensada como luz decorativa de pared. Producto oficial de One Piece distribuido por ABYstyle en Europa.',
    features: [
      'Volumen 3D del sombrero de paja',
      'Funciona con 3 pilas AA (no incluidas)',
      'Medidas: 25 × 7,75 × 25 cm',
      'Acabado decorativo para pared'
    ],
    audience: 'Fans de One Piece',
    price: 29.99,
    categoryPath: 'one-piece',
    slug: 'one-piece-lampe-chapeau-de-paille',
    imageIds: [8221924, 8221925, 8221926, 8221927, 8221928]
  }),
  lamp({
    id: 'abystyle-naruto-akatsuki',
    ref: 'ABYLIG019E',
    name: 'Lámpara Nube Akatsuki — Naruto Shippuden',
    title: 'NARUTO SHIPPUDEN Lampe Nuage Akatsuki',
    tagline: 'La nube roja de Akatsuki, en luz de pared.',
    description:
      'Lámpara con la nube roja del clan Akatsuki sobre fondo oscuro. Se ilumina desde el interior y puede colgarse gracias a la ranura trasera. Referencia oficial de Naruto Shippuden distribuida por ABYstyle en Europa.',
    features: [
      'Nube Akatsuki iluminada',
      'Funciona con 3 pilas AA (no incluidas)',
      'Ranura trasera para colgar en pared',
      'Medidas: 24 × 16 × 6 cm'
    ],
    audience: 'Fans de Naruto Shippuden',
    price: 24.99,
    categoryPath: 'naruto',
    slug: 'naruto-shippuden-lampe-nuage-akatsuki',
    imageIds: [14525065, 14525066, 14525067, 14525068, 14525069]
  }),
  lamp({
    id: 'abystyle-dragon-ball-kame',
    ref: 'ABYLIG017E',
    name: 'Lámpara Símbolo Kame — Dragon Ball Z',
    title: 'DRAGON BALL Z Lampe Symbole Kame',
    tagline: 'El kanji de la Escuela Tortuga, encendido.',
    description:
      'Lámpara con el símbolo Kame (Escuela Tortuga) de Dragon Ball Z. Luz interior para escritorio o pared, con ranura trasera. Producto oficial de Dragon Ball Z distribuido por ABYstyle en Europa.',
    features: [
      'Símbolo Kame iluminado',
      'Funciona con 3 pilas AA (no incluidas)',
      'Ranura trasera para colgar en pared',
      'Medidas: 17 × 17,4 × 6 cm'
    ],
    audience: 'Fans de Dragon Ball Z',
    price: 24.99,
    categoryPath: 'dragon-ball',
    slug: 'dragon-ball-z-lampe-symbole-kame',
    imageIds: [14525057, 14525058, 14525059, 14525060, 14525061]
  }),
  lamp({
    id: 'abystyle-harry-potter-quai-9-3-4',
    ref: 'ABYLIG013E',
    name: 'Lámpara Andén 9¾ — Harry Potter',
    title: 'HARRY POTTER Lampe Quai 9 3/4',
    tagline: 'El cartel del andén 9¾ del Express de Hogwarts.',
    description:
      'Lámpara con el rótulo del andén 9¾ de la estación de King\'s Cross. Iluminación interior para escritorio o pared. Producto oficial de Harry Potter distribuido por ABYstyle en Europa.',
    features: [
      'Rótulo del andén 9¾ iluminado',
      'Funciona con 3 pilas AAA (no incluidas)',
      'Medidas: 21,5 × 15 × 8 cm',
      'Vídeo oficial del producto disponible en la ficha del proveedor'
    ],
    audience: 'Fans de Harry Potter',
    price: 24.99,
    categoryPath: 'harry-potter',
    slug: 'harry-potter-lampe-quai-9-3-4',
    imageIds: [14525022, 14525023, 14525024, 14525025, 14525026],
    videoUrl: 'https://www.youtube.com/watch?v=cc0StHkdjcs'
  }),
  lamp({
    id: 'abystyle-one-piece-skull',
    ref: 'ABYLIG015E',
    name: 'Lámpara Calavera — One Piece',
    title: 'ONE PIECE Lampe Skull',
    tagline: 'La calavera con sombrero de paja, en versión lámpara.',
    description:
      'Lámpara con la calavera de los Piratas de Sombrero de Paja. Iluminación interior y ranura trasera para colgarla en la pared. Producto oficial de One Piece distribuido por ABYstyle en Europa.',
    features: [
      'Calavera de los Sombrero de Paja iluminada',
      'Funciona con 3 pilas AA (no incluidas)',
      'Medidas: 20 × 6 × 21 cm',
      'Vídeo oficial del producto disponible en la ficha del proveedor'
    ],
    audience: 'Fans de One Piece',
    price: 24.99,
    categoryPath: 'one-piece',
    slug: 'one-piece-lampe-skull',
    imageIds: [14525039, 14525040, 14525041, 14525042, 14525043],
    videoUrl: 'https://www.youtube.com/watch?v=Ih6pw9nHV8Y'
  }),
  lamp({
    id: 'abystyle-harry-potter-hedwige',
    ref: 'ABYLIG014E',
    name: 'Lámpara Hedwig — Harry Potter',
    title: 'HARRY POTTER Lampe Hedwige',
    tagline: 'La lechuza de Harry, recargable por USB y sin cables.',
    description:
      'Lámpara de Hedwig, la lechuza de Harry Potter, recargable por USB: no necesita pilas. Acabado de figura, pensada como luz de mesilla. Producto oficial de Harry Potter distribuido por ABYstyle en Europa.',
    features: [
      'Batería recargable por micro-USB (cable incluido)',
      'No requiere pilas',
      'Medidas: 18 × 18,2 × 17,2 cm',
      'Luz ambiental de mesilla'
    ],
    audience: 'Fans de Harry Potter',
    price: 39.99,
    categoryPath: 'harry-potter',
    slug: 'harry-potter-lampe-hedwige',
    imageIds: [14525029, 14525030, 14525031, 14525032, 14525033]
  }),
  lamp({
    id: 'abystyle-disney-lumiere',
    ref: 'ABYLIG016E',
    name: 'Lámpara Lumièra 3D — La Bella y la Bestia',
    title: 'DISNEY Lampe La Belle et la Bête Lumière',
    tagline: 'El candelabro Lumière, la pieza más detallada de la colección.',
    description:
      'Lámpara 3D de Lumière, el candelabro de La Bella y la Bestia. Fabricada en plástico, metal y poliresina, con el acabado más cuidado de la colección. Producto oficial Disney distribuido por ABYstyle en Europa.',
    features: [
      'Figura 3D de Lumière con iluminación',
      'Materiales: plástico, metal y poliresina',
      'Funciona con 3 pilas AAA (no incluidas)',
      'Medidas: 24 × 9 × 31 cm',
      'Vídeo oficial del producto disponible en la ficha del proveedor'
    ],
    audience: 'Fans de Disney y La Bella y la Bestia',
    price: 49.99,
    categoryPath: 'disney-pixar',
    slug: 'disney-lampe-la-belle-et-la-bete-lumiere',
    imageIds: [14525048, 14525049, 14525050, 14525051, 14525052],
    videoUrl: 'https://www.youtube.com/watch?v=2RarGSoWvpU'
  }),
  lamp({
    id: 'abystyle-dragon-ball-boule-de-cristal',
    ref: 'ABYLIG002E',
    name: 'Lámpara Bola de Cristal — Dragon Ball Z',
    title: 'DRAGON BALL Z Lampe Boule de Cristal',
    tagline: 'La bola de cuatro estrellas del abuelo Gohan, recargable.',
    description:
      'Lámpara esférica con la bola de cristal de cuatro estrellas de Dragon Ball Z. Recargable por USB, sin pilas. Producto oficial de Dragon Ball Z distribuido por ABYstyle en Europa.',
    features: [
      'Bola de cristal de 4 estrellas iluminada',
      'Batería recargable por micro-USB (cable incluido)',
      'No requiere pilas',
      'Medidas: 19 × 18 × 18 cm'
    ],
    audience: 'Fans de Dragon Ball Z',
    price: 39.99,
    categoryPath: 'dragon-ball',
    slug: 'dragon-ball-z-lampe-boule-de-cristal',
    imageIds: [14525011, 14525012, 14525013, 14525014, 14525015]
  }),
  lamp({
    id: 'abystyle-dragon-ball-mini-boule',
    ref: 'ABYLIG012E',
    name: 'Mini Lámpara Bola de Cristal Ø8,2 cm — Dragon Ball Z',
    title: 'DRAGON BALL Z Lampe Mini Boule de Cristal O82mm',
    tagline: 'La bola de cristal de bolsillo: se enciende con un toque.',
    description:
      'Versión mini de la bola de cristal de Dragon Ball Z, de 8,2 cm de diámetro. Se enciende y apaga con un toque y funciona con pilas de botón ya incluidas. Producto oficial de Dragon Ball Z distribuido por ABYstyle en Europa.',
    features: [
      'Encendido y apagado por toque (tap on/off)',
      'Incluye 3 pilas LR44',
      'Diámetro: 8,2 cm',
      'Vídeo oficial del producto disponible en la ficha del proveedor'
    ],
    audience: 'Fans de Dragon Ball Z',
    price: 14.99,
    categoryPath: 'dragon-ball',
    slug: 'dragon-ball-z-lampe-mini-boule-de-cristal-o82mm',
    imageIds: [14525016, 14525017, 14525018, 14525019, 14525020],
    videoUrl: 'https://www.youtube.com/watch?v=1KnKVeeV68I'
  })
];

export const ABYSTYLE_SOURCE_META: ProductSourceMeta = {
  id: 'abystyle',
  label: 'ABYstyle',
  region: 'FR',
  kind: 'retailer',
  products: ABYSTYLE_PRODUCTS.length,
  generatedAt: '2026-10-24',
  // Distribuidor europeo: el precio publicado es PVP, no coste mayorista.
  pricingPolicy: RETAIL_PURCHASE_POLICY
};
