import { Inject, Injectable, Optional } from "@angular/core";
import { BehaviorSubject, combineLatest, Observable } from "rxjs";
import { take } from "rxjs/operators";
import {
  BUSINESS_TYPE_LABEL,
  CATEGORY_LABEL,
  CategoryId,
  Product,
  ProductSupplier,
} from "../product.model";
import { AlibabaProductSource } from "./alibaba/alibaba.source";
import { retailPrice } from "./pricing";
import { CATALOG_SOURCES, ProductSourceAdapter } from "./product-source";
import { ProductSourceMeta, SupplierProduct } from "./supplier-product.model";

export type CatalogSort =
  | "destacados"
  | "precio-asc"
  | "precio-desc"
  | "valoracion";

export interface CatalogStats {
  products: number;
  suppliers: number;
  verified: number;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
}

export const COUNTRY_LABEL: { [code: string]: string } = {
  CN: "China",
  ES: "España",
  US: "Estados Unidos",
  IN: "India",
};

/**
 * Repositorio único del catálogo. Agrega todos los proveedores registrados en
 * CATALOG_SOURCES y normaliza su oferta a Product. Los componentes solo hablan
 * con este servicio, nunca con un proveedor concreto.
 */
@Injectable({ providedIn: "root" })
export class CatalogService {
  private readonly bucket = new BehaviorSubject<Product[]>([]);
  private readonly index = new Map<string, Product>();
  private readonly adapterList: ProductSourceAdapter[];

  readonly products$: Observable<Product[]> = this.bucket.asObservable();

  constructor(
    @Optional() @Inject(CATALOG_SOURCES) sources: ProductSourceAdapter[] | null,
  ) {
    // multi:true ya entrega un array; si además se registra un array como
    // useValue llega anidado. Aplanamos y descartamos lo que no sea adaptador.
    const provided = (sources || [])
      .reduce<any[]>((all, entry) => all.concat(entry), [])
      .filter((entry) => !!entry && typeof entry.load === "function");
    this.adapterList = provided.length ? provided : [new AlibabaProductSource()];

    // Los adaptadores basados en snapshot emiten de forma síncrona, así que el
    // catálogo está disponible en el primer render y en los resolvers de ruta.
    combineLatest(this.adapterList.map((source) => source.load()))
      .pipe(take(1))
      .subscribe((groups) => {
        const products = this.normalize(
          groups.reduce((all, group) => all.concat(group), []),
        );
        this.index.clear();
        products.forEach((product) => this.index.set(product.id, product));
        this.bucket.next(products);
      });
  }

  all(): Product[] {
    return this.bucket.value;
  }

  byId(id: string): Product | undefined {
    return this.index.get(id);
  }

  byCategory(category: CategoryId | "todos"): Product[] {
    return category === "todos"
      ? this.all()
      : this.all().filter((p) => p.category === category);
  }

  countFor(category: CategoryId | "todos"): number {
    return this.byCategory(category).length;
  }

  featured(count: number = 1): Product[] {
    return this.sorted(this.all(), "destacados").slice(0, count);
  }

  search(
    term: string,
    category: CategoryId | "todos" = "todos",
    sort: CatalogSort = "destacados",
  ): Product[] {
    const needle = (term || "").trim().toLowerCase();
    let list = this.byCategory(category);
    if (needle) {
      list = list.filter(
        (product) =>
          product.name.toLowerCase().indexOf(needle) !== -1 ||
          product.tagline.toLowerCase().indexOf(needle) !== -1 ||
          CATEGORY_LABEL[product.category].toLowerCase().indexOf(needle) !==
            -1 ||
          product.supplier.name.toLowerCase().indexOf(needle) !== -1 ||
          product.features.join(" ").toLowerCase().indexOf(needle) !== -1,
      );
    }
    return this.sorted(list, sort);
  }

  sorted(list: Product[], sort: CatalogSort): Product[] {
    const copy = list.slice();
    switch (sort) {
      case "precio-asc":
        return copy.sort((a, b) => a.price - b.price);
      case "precio-desc":
        return copy.sort((a, b) => b.price - a.price);
      case "valoracion":
        return copy.sort((a, b) => b.rating - a.rating || b.sales - a.sales);
      default:
        return copy.sort((a, b) => b.sales - a.sales || b.rating - a.rating);
    }
  }

  sources(): ProductSourceMeta[] {
    return this.adapterList.map((source) => source.meta);
  }

  stats(): CatalogStats {
    const products = this.all();
    if (!products.length) {
      return {
        products: 0,
        suppliers: 0,
        verified: 0,
        minPrice: 0,
        maxPrice: 0,
        avgPrice: 0,
      };
    }
    const prices = products.map((p) => p.price);
    const supplierIds: { [id: string]: boolean } = {};
    const verifiedIds: { [id: string]: boolean } = {};
    products.forEach((p) => {
      supplierIds[p.supplier.id] = true;
      if (p.supplier.verified) {
        verifiedIds[p.supplier.id] = true;
      }
    });
    return {
      products: products.length,
      suppliers: Object.keys(supplierIds).length,
      verified: Object.keys(verifiedIds).length,
      minPrice: Math.min.apply(null, prices),
      maxPrice: Math.max.apply(null, prices),
      avgPrice: Math.round(
        prices.reduce((sum, price) => sum + price, 0) / prices.length,
      ),
    };
  }

  // --- normalización -------------------------------------------------------

  private normalize(rows: SupplierProduct[]): Product[] {
    const seen: { [id: string]: boolean } = {};
    const products: Product[] = [];
    for (const row of rows) {
      if (seen[row.id]) {
        continue;
      }
      seen[row.id] = true;
      products.push(this.toProduct(row));
    }
    return products;
  }

  private toProduct(row: SupplierProduct): Product {
    const price = retailPrice(row.supplierPriceMin, row.supplierPriceMax);
    const supplier: ProductSupplier = {
      id: row.supplier.id,
      name: row.supplier.name,
      country: row.supplier.country,
      verified: row.supplier.verified,
      rating: row.supplier.rating,
      yearsActive: row.supplier.yearsActive,
      businessType: row.supplier.businessType,
      sold180: row.supplier.sold180,
      deliveryRate: row.supplier.deliveryRate,
      delivery: row.supplier.delivery,
      moq: row.moq,
      moqLabel: row.moqLabel,
      unit: row.unit,
      priceMin: row.supplierPriceMin,
      priceMax: row.supplierPriceMax,
      currency: row.currency,
      quantityPrices: row.quantityPrices,
      productUrl: row.buyUrl,
    };

    const specs = this.buildSpecs(row, supplier);

    return {
      id: row.id,
      name: row.name,
      tagline: row.tagline,
      category: row.category,
      price,
      supplierPriceMin: row.supplierPriceMin,
      supplierPriceMax: row.supplierPriceMax,
      currency: row.currency,
      image: row.images[0],
      images: row.images,
      rating: row.reviewsScore || row.supplier.rating,
      badge: row.supplier.verified ? "Proveedor verificado" : undefined,
      badgeTone: row.supplier.verified ? "lime" : undefined,
      description: row.description,
      features: row.features,
      specs,
      sales: row.supplier.sold180,
      audience: row.audience,
      availability: row.supplier.delivery ? "bajo-pedido" : "disponible",
      availabilityLabel: row.supplier.delivery
        ? "Bajo pedido · " + row.supplier.delivery
        : "Disponible en el proveedor",
      buyUrl: row.buyUrl,
      sourceId: row.sourceId,
      sourceLabel: row.sourceLabel,
      supplier,
    };
  }

  private buildSpecs(
    row: SupplierProduct,
    supplier: ProductSupplier,
  ): { label: string; value: string }[] {
    const specs: { label: string; value: string }[] = [
      { label: "Proveedor", value: supplier.name },
      {
        label: "Origen",
        value: COUNTRY_LABEL[supplier.country] || supplier.country,
      },
      {
        label: "Tipo",
        value:
          BUSINESS_TYPE_LABEL[supplier.businessType] || supplier.businessType,
      },
      { label: "MOQ del fabricante", value: supplier.moqLabel },
      { label: "Plazo", value: supplier.delivery || "Según disponibilidad" },
      { label: "Valoración proveedor", value: supplier.rating + " / 5" },
      { label: "Vendidos (180 días)", value: String(supplier.sold180) },
      { label: "Ref. proveedor", value: row.sourceId },
    ];
    if (supplier.yearsActive) {
      specs.push({
        label: "Antigüedad",
        value: supplier.yearsActive + " años en Alibaba.com",
      });
    }
    if (supplier.deliveryRate) {
      specs.push({
        label: "Tasa de entrega",
        value: supplier.deliveryRate + " %",
      });
    }
    if (supplier.quantityPrices.length > 1) {
      const tiers = supplier.quantityPrices
        .slice(0, 3)
        .map((tier) => tier.minQty + "+ uds · " + tier.price.toFixed(2) + " €")
        .join(" · ");
      specs.push({ label: "Tramos por volumen", value: tiers });
    }
    return specs;
  }
}
