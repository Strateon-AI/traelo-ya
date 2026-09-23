export interface QuoteLineInput {
  quantity: number;
  unitPrice: number;
  /**
   * Línea normal: se cobra por peso. `flatRateUsd` debe ir undefined.
   * Línea de categoría con tarifa fija (celular, laptop, etc.): `flatRateUsd`
   * es el precio fijo por unidad de ese mes, y `unitWeightKg` se ignora —
   * esa línea no aporta al peso total, aporta directo en dólares.
   */
  unitWeightKg?: number;
  flatRateUsd?: number;
}

export interface QuoteResult {
  totalWeightKg: number;
  shippingCost: number;
  flatRateCost: number;
  commissionCost: number;
  hasCommission: boolean;
  hasFlatRate: boolean;
  total: number;
}

/** Peso mínimo facturable por línea — regla del courier: ningún paquete se cobra por menos de esto, aunque pese menos. */
export const PESO_MINIMO_FACTURABLE_KG = 1;

/**
 * Cotización con varias líneas de producto, que pueden ser de dos tipos:
 *
 * 1. Por peso (la mayoría): el peso y el precio son "por unidad" — se
 *    multiplican por la cantidad de esa línea antes de sumarlos entre
 *    todas. Cada línea representa un paquete que llega por separado al
 *    almacén, así que antes de sumar se le aplica el mínimo facturable del
 *    courier: un paquete de 0,3kg se cobra igual que uno de 1kg. Este piso
 *    es por línea, no sobre el total.
 *
 * 2. Tarifa fija por categoría (celular, tablet, laptop...): reemplaza el
 *    cálculo por peso para esa línea — no aporta kilos, aporta un monto
 *    fijo en dólares (multiplicado por cantidad). Es una decisión explícita
 *    del courier: para estas categorías cobran un número redondo en vez de
 *    calcular por peso.
 *
 * El envío total es la suma de ambos tipos de línea. La comisión de
 * "Compramos por vos" (si está habilitada) se calcula sobre la suma de
 * precio×cantidad de TODAS las líneas, sin importar el tipo — es un
 * concepto separado (el 5% de comprar por el cliente), no relacionado con
 * cómo se cobra el envío.
 */
export function calculateQuote(params: {
  isBuyForYou: boolean;
  lines: QuoteLineInput[];
  ratePerKg: number;
  commissionPercent: number;
  commissionEnabled: boolean;
}): QuoteResult {
  let totalWeightKg = 0;
  let flatRateCost = 0;

  for (const line of params.lines) {
    const qty = Math.max(0, line.quantity);
    if (typeof line.flatRateUsd === "number") {
      flatRateCost += qty * Math.max(0, line.flatRateUsd);
    } else {
      const lineWeight = qty * Math.max(0, line.unitWeightKg ?? 0);
      const billableLineWeight = lineWeight > 0 ? Math.max(lineWeight, PESO_MINIMO_FACTURABLE_KG) : 0;
      totalWeightKg += billableLineWeight;
    }
  }
  totalWeightKg = round2(totalWeightKg);
  flatRateCost = round2(flatRateCost);
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
    flatRateCost,
    commissionCost,
    hasCommission: applyCommission,
    hasFlatRate: flatRateCost > 0,
    total: round2(shippingCost + flatRateCost + commissionCost),
  };
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatUsd(value: number): string {
  return `US$ ${value.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
