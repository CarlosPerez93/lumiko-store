import { Observable, of } from 'rxjs';
import { ProductSourceAdapter } from '../product-source';
import { ProductSourceMeta, SupplierProduct } from '../supplier-product.model';
import { ALIBABA_PRODUCTS, ALIBABA_SOURCE_META } from '../data/alibaba.products';

/**
 * Adaptador del marketplace Alibaba.com.
 *
 * Los datos viven en data/alibaba.products.ts, un snapshot generado por
 * tools/generate-catalog.js a partir de respuestas reales de la API de
 * productos. El snapshot está versionado: el catálogo es reproducible y
 * auditable, y no depende de una llamada en tiempo de ejecución.
 */
export class AlibabaProductSource implements ProductSourceAdapter {
  readonly meta: ProductSourceMeta = ALIBABA_SOURCE_META as ProductSourceMeta;

  constructor(private readonly rows: SupplierProduct[] = ALIBABA_PRODUCTS) {}

  load(): Observable<SupplierProduct[]> {
    return of(this.rows);
  }
}
