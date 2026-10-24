import { InjectionToken } from "@angular/core";
import { Observable } from "rxjs";
import { ProductSourceMeta, SupplierProduct } from "./supplier-product.model";

/**
 * Contrato de un proveedor de catálogo.
 *
 * Para añadir un proveedor nuevo (1688, CJ Dropshipping, un ERP propio...):
 *   1. implementar esta interfaz en src/app/core/catalog/<proveedor>/
 *   2. devolver SupplierProduct[] normalizados (sin lógica de tienda)
 *   3. registrarlo en CATALOG_SOURCES (app.module.ts)
 * No hay que tocar componentes, rutas, carrito ni checkout.
 */
export interface ProductSourceAdapter {
  readonly meta: ProductSourceMeta;
  load: () => Observable<SupplierProduct[]>;
}

/** Registro de proveedores activos, inyectable y sustituible en tests. */
export const CATALOG_SOURCES = new InjectionToken<ProductSourceAdapter[]>(
  "LUMIKO_CATALOG_SOURCES",
);
