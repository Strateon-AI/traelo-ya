export interface QuoteResult {
  shippingCost: number;
  total: number;
}

/**
 * El envío se cobra siempre por peso real (`ratePerKg`, hoy US$28/kg) — no
 * hay catálogo fijo de productos, así que el precio del producto ya no se
 * pide en el formulario. La comisión del 5% de "Compramos por vos" no se
 * calcula acá: se avisa en el formulario y se coordina el monto por
 * WhatsApp, porque requeriría el precio real del producto.
 */
export function calculateQuote(params: { weightKg: number; ratePerKg: number }): QuoteResult {
  const shippingCost = round2(Math.max(0, params.weightKg || 0) * params.ratePerKg);
  return { shippingCost, total: shippingCost };
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatUsd(value: number): string {
  return `US$ ${value.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
