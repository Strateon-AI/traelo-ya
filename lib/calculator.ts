export interface QuoteLineInput {
  quantity: number;
  unitWeightKg: number;
  unitPrice: number;
}

export interface QuoteResult {
  totalWeightKg: number;
  shippingCost: number;
  commissionCost: number;
  hasCommission: boolean;
  total: number;
}

/**
 * Cotización con varias líneas de producto. El peso y el precio de cada
 * línea son "por unidad" — se multiplican por la cantidad de esa línea antes
 * de sumarlos entre todas. El envío se cobra siempre por el peso total real
 * (`ratePerKg`, hoy US$28/kg); la comisión de "Compramos por vos" (si está
 * habilitada) se calcula sobre la suma de precio×cantidad de todas las
 * líneas.
 */
export function calculateQuote(params: {
  isBuyForYou: boolean;
  lines: QuoteLineInput[];
  ratePerKg: number;
  commissionPercent: number;
  commissionEnabled: boolean;
}): QuoteResult {
  const totalWeightKg = round2(
    params.lines.reduce(
      (sum, line) => sum + Math.max(0, line.quantity) * Math.max(0, line.unitWeightKg),
      0
    )
  );
  const shippingCost = round2(totalWeightKg * params.ratePerKg);

  const applyCommission = params.isBuyForYou && params.commissionEnabled;
  const totalPriceBase = params.lines.reduce(
    (sum, line) => sum + Math.max(0, line.quantity) * Math.max(0, line.unitPrice),
    0
  );
  const commissionCost = applyCommission
    ? round2((totalPriceBase * params.commissionPercent) / 100)
    : 0;

  return {
    totalWeightKg,
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
