/**
 * Política de precios de LUMIKO.
 *
 * Los productos se compran a proveedores mayoristas (Alibaba.com) y se venden
 * al público. El precio de venta NO es un dato del proveedor: se calcula con
 * esta regla, versionada y auditable. Cambiarla afecta a todo el catálogo sin
 * tocar datos ni componentes.
 *
 *   precioVenta = max(MINIMO, ceil(precioProveedorMax * MARGEN / paso) * paso - paso)
 *
 * Se toma el precio máximo del rango del proveedor para cubrir el peor caso del
 * tramo de cantidad más bajo.
 */
export interface PricingPolicy {
  /** Multiplicador sobre el coste del proveedor. */
  marginMultiplier: number;
  /** Suelo comercial: evita vender por debajo de este importe. */
  minimumRetail: number;
  /** Granularidad del redondeo comercial (0.1 => acabados en ,90). */
  roundingStep: number;
}

export const PRICING_POLICY: PricingPolicy = {
  marginMultiplier: 2.6,
  minimumRetail: 12.9,
  roundingStep: 0.1
};

/**
 * Politica para fuentes cuyo coste es PVP de distribuidor, no mayorista.
 *
 * Un distribuidor europeo (ABYstyle) publica el precio de venta al publico:
 * aplicarle el 2,6 de mayorista dejaria una lampara de 24,99 EUR en 64,90 EUR,
 * fuera de mercado. Con 1,3 el margen bruto es ~23 %, que es el margen real
 * de reventa de producto licenciado comprado a PVP. Bajarlo mas deja la tienda
 * sin margen; subirlo la saca del precio de referencia del fabricante.
 *
 * Es una decision comercial, no tecnica: si LUMIKO consigue cuenta de
 * mayorista en Abysse Corp (trade.abyssecorp.com), esta fuente debe volver a
 * PRICING_POLICY y el margen sube sin tocar codigo de la tienda.
 */
export const RETAIL_PURCHASE_POLICY: PricingPolicy = {
  marginMultiplier: 1.3,
  minimumRetail: 12.9,
  roundingStep: 0.1
};

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function retailPrice(
  supplierPriceMin: number,
  supplierPriceMax: number,
  policy: PricingPolicy = PRICING_POLICY
): number {
  const cost = Math.max(supplierPriceMin, supplierPriceMax, 0);
  if (!cost) {
    return policy.minimumRetail;
  }
  const stepped = Math.ceil(cost * policy.marginMultiplier / policy.roundingStep) * policy.roundingStep;
  return round2(Math.max(policy.minimumRetail, stepped - policy.roundingStep));
}
