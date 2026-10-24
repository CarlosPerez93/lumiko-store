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
