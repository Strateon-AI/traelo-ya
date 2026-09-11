export interface QuoteResult {
  shippingCost: number;
  commissionCost: number;
  hasCommission: boolean;
  total: number;
}

/**
 * El envío se cobra siempre por peso real (`ratePerKg`, hoy US$28/kg) — no
 * hay catálogo fijo de productos.
 *
 * La comisión de "Compramos por vos" depende de `commissionEnabled`
 * (configurable en /admin, tabla quote_config):
 * - true: se calcula sobre `productPrice × quantity` y se suma al total.
 * - false: no se calcula nada acá — el formulario solo avisa el % y se
 *   coordina el monto por WhatsApp (para eso ni hace falta pedir el precio).
 */
export function calculateQuote(params: {
  isBuyForYou: boolean;
  weightKg: number;
  ratePerKg: number;
  productPrice: number;
  quantity: number;
  commissionPercent: number;
  commissionEnabled: boolean;
}): QuoteResult {
  const shippingCost = round2(Math.max(0, params.weightKg || 0) * params.ratePerKg);

  const applyCommission = params.isBuyForYou && params.commissionEnabled;
  const quantity = Math.max(1, Math.floor(params.quantity) || 1);
  const commissionCost = applyCommission
    ? round2(((params.productPrice || 0) * quantity * params.commissionPercent) / 100)
    : 0;

  return {
    shippingCost,
    commissionCost,
    hasCommission: applyCommission,
    total: round2(shippingCost + commissionCost),
  };
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatUsd(value: number): string {
  return `US$ ${value.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
