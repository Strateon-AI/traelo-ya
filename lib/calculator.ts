import type { ClientType } from "./types";

export interface QuoteResult {
  shippingCost: number;
  commissionRate: number;
  commissionCost: number;
  total: number;
}

/**
 * Cotización única: no hay catálogo fijo de productos, Tráelo Ya trae
 * cualquier cosa y el envío se cobra siempre por peso real (`ratePerKg`,
 * hoy US$28/kg).
 * - `productPrice` es opcional — solo se usa para calcular la comisión del
 *   5% cuando Tráelo Ya compra por el cliente. Nunca se suma al total: ese
 *   valor lo paga el cliente directo en la tienda o se lo reembolsa a
 *   Tráelo Ya por separado.
 * - `weightKg` es el peso estimado de todo el pedido (no por unidad) y es
 *   lo único que determina el costo de envío.
 */
export function calculateQuote(params: {
  clientType: ClientType;
  weightKg: number;
  ratePerKg: number;
  productPrice: number;
  quantity: number;
  commissionPercent: number;
}): QuoteResult {
  const quantity = Math.max(1, Math.floor(params.quantity) || 1);
  const shippingCost = round2(Math.max(0, params.weightKg || 0) * params.ratePerKg);

  const commissionRate = params.clientType === "buy-for-you" ? params.commissionPercent : 0;
  const commissionCost =
    commissionRate > 0
      ? round2(((params.productPrice || 0) * quantity * commissionRate) / 100)
      : 0;

  return {
    shippingCost,
    commissionRate,
    commissionCost,
    total: round2(shippingCost + commissionCost),
  };
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatUsd(value: number): string {
  return `US$ ${value.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
