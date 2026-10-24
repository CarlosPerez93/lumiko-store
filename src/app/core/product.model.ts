import { SupplierTerms } from './catalog/supplier-product.model';

export type CategoryId = 'lamparas' | 'robots' | 'proyeccion' | 'gaming';

/**
 * Condiciones comerciales del proveedor que originan el producto.
 * Se muestran en la ficha para que el comprador sepa qué está adquiriendo,
 * con qué MOQ trabaja el fabricante y de dónde sale la referencia.
 */
export interface ProductSupplier extends SupplierTerms {
  moq: number;
  moqLabel: string;
  unit: string;
  priceMin: number;
  priceMax: number;
  currency: string;
  quantityPrices: { minQty: number; maxQty: number | null; price: number }[];
  /** Enlace público al producto en el marketplace del proveedor. */
  productUrl: string;
}

/**
 * Producto tal y como lo consume la tienda.
 * Es agnóstico del proveedor: cualquier adaptador debe producir esta forma.
 */
export interface Product {
  /** Slug estable para /producto/:id */
  id: string;
  name: string;
  tagline: string;
  category: CategoryId;
  /** Precio de venta LUMIKO. Se calcula en pricing.ts, no viene del proveedor. */
  price: number;
  supplierPriceMin: number;
  supplierPriceMax: number;
  currency: string;
  image: string;
  images: string[];
  /** Valoración pública del PROVEEDOR, no del producto. */
  rating: number;
  badge?: string;
  badgeTone?: 'pink' | 'cyan' | 'lime';
  description: string;
  features: string[];
  specs: { label: string; value: string }[];
  isNew?: boolean;
  /** Unidades vendidas por el proveedor en los últimos 180 días. */
  sales: number;
  audience: string;
  availability: 'disponible' | 'bajo-pedido';
  availabilityLabel: string;
  buyUrl: string;
  sourceId: string;
  sourceLabel: string;
  supplier: ProductSupplier;
}

export interface Category {
  id: CategoryId | 'todos';
  label: string;
  short: string;
}

export const CATEGORIES: Category[] = [
  { id: 'todos', label: 'Todo el catálogo', short: 'Todos' },
  { id: 'lamparas', label: 'Lámparas inteligentes', short: 'Lámparas' },
  { id: 'robots', label: 'Robots de compañía', short: 'Robots' },
  { id: 'proyeccion', label: 'Proyección', short: 'Proyección' },
  { id: 'gaming', label: 'Gaming & pixel', short: 'Gaming' }
];

export const CATEGORY_LABEL: Record<CategoryId, string> = {
  lamparas: 'Lámpara inteligente',
  robots: 'Robot de compañía',
  proyeccion: 'Proyección',
  gaming: 'Gaming'
};

export const BUSINESS_TYPE_LABEL: { [key: string]: string } = {
  manufacturer: 'Fabricante',
  trading_company: 'Comercializadora',
  trading: 'Comercializadora',
  retailer: 'Distribuidor oficial'
};
