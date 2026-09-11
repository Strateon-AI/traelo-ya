import type { ClientType } from "./types";

export interface ByProductResult {
  shippingCost: number;
  commissionRate: number;
  commissionCost: number;
  total: number;
}

/**
 * Cotización "por producto".
 *
 * No hay catálogo fijo de productos: Tráelo Ya trae cualquier cosa, y el
 * envío se cobra por peso real (`ratePerKg`, hoy US$28/kg) — igual que en
 * la pestaña "Por peso". Acá lo único que cambia es que además se pide el
 * nombre y el precio del producto:
 * - `productPrice` sirve solo para calcular la comisión del 5% cuando
 *   Tráelo Ya compra por el cliente — nunca se suma al total, porque ese
 *   valor lo paga el cliente directo en la tienda o se lo reembolsa a
 *   Tráelo Ya por separado.
 * - `weightKg` es el peso estimado de todo el pedido (no por unidad) y es
 *   lo que determina el costo de envío, igual que en "Por peso".
 */
export function calculateByProduct(params: {
  clientType: ClientType;
  weightKg: number;
  ratePerKg: number;
  productPrice: number;
  quantity: number;
  commissionPercent: number;
}): ByProductResult {
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

export interface ByWeightResult {
  total: number;
}

export function calculateByWeight(params: { weightKg: number; ratePerKg: number }): ByWeightResult {
  const weight = Math.max(0, params.weightKg || 0);
  return { total: round2(weight * params.ratePerKg) };
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatUsd(value: number): string {
  return `US$ ${value.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
