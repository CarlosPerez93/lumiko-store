import { Observable, of } from 'rxjs';
import { ProductSourceAdapter } from '../product-source';
import { ProductSourceMeta, SupplierProduct } from '../supplier-product.model';
import { ABYSTYLE_PRODUCTS, ABYSTYLE_SOURCE_META } from '../data/abystyle.products';

/**
 * Adaptador del distribuidor europeo ABYstyle (Abysse Corp, Francia).
 *
 * Los datos viven en data/abystyle.products.ts, un snapshot curado de 12
 * lámparas verificadas en la web pública del proveedor. La fuente declara su
 * propia política de precios (RETAIL_PURCHASE_POLICY) porque su coste es PVP de
 * distribuidor, no precio mayorista.
 */
export class AbystyleProductSource implements ProductSourceAdapter {
  readonly meta: ProductSourceMeta = ABYSTYLE_SOURCE_META as ProductSourceMeta;

  constructor(private readonly rows: SupplierProduct[] = ABYSTYLE_PRODUCTS) {}

  load(): Observable<SupplierProduct[]> {
    return of(this.rows);
  }
}
