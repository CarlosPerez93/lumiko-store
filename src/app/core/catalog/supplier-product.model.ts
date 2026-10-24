/**
 * Contrato que debe cumplir cualquier proveedor para entrar en el catalogo.
 *
 * Un proveedor NUNCA habla el idioma de la tienda: entrega SupplierProduct
 * (datos tal cual los publica) y el adaptador los normaliza a Product.
 * Anadir un proveedor nuevo = crear un adaptador + registrarlo en
 * CatalogService. No hay que tocar componentes ni rutas.
 */
export type StoreCategory = 'lamparas' | 'robots' | 'proyeccion' | 'gaming';

export interface SupplierTerms {
  id: string;
  name: string;
  country: string;
  verified: boolean;
  /** Valoracion publica del proveedor (no del producto). */
  rating: number;
  yearsActive: number;
  businessType: string;
  sold180: number;
  deliveryRate: number;
  /** Texto de plazo tal cual lo publica el proveedor, si existe. */
  delivery: string;
}

export interface SupplierProduct {
  /** Slug estable usado en /producto/:id */
  id: string;
  /** Identificador en el sistema del proveedor. */
  sourceId: string;
  sourceLabel: string;
  supplier: SupplierTerms;
  /** Titulo original del proveedor (se conserva para trazabilidad). */
  title: string;
  name: string;
  tagline: string;
  description: string;
  features: string[];
  audience: string;
  category: StoreCategory;
  images: string[];
  buyUrl: string;
  videoUrl?: string;
  moq: number;
  moqLabel: string;
  unit: string;
  supplierPriceMin: number;
  supplierPriceMax: number;
  currency: string;
  quantityPrices: { minQty: number; maxQty: number | null; price: number }[];
  /** Valoracion de la publicacion del producto, si el proveedor la publica. */
  reviewsScore?: number;
}

export interface ProductSourceMeta {
  id: string;
  label: string;
  region: string;
  kind: 'marketplace' | 'factory' | 'dropshipper';
  products: number;
  generatedAt: string;
}
