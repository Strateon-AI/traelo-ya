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

/** Peso mínimo facturable por línea — regla del courier: ningún paquete se cobra por menos de esto, aunque pese menos. */
export const PESO_MINIMO_FACTURABLE_KG = 1;

/**
 * Cotización con varias líneas de producto. El peso y el precio de cada
 * línea son "por unidad" — se multiplican por la cantidad de esa línea antes
 * de sumarlos entre todas.
 *
 * Cada línea representa un paquete que llega por separado al almacén, así
 * que antes de sumar se le aplica el mínimo facturable del courier: un
 * paquete de 0,3kg se cobra igual que uno de 1kg. Este piso es por línea, no
 * sobre el total — 3 productos de 0,2kg cada uno se cobran como 3kg, no
 * como 1kg, porque llegan como 3 paquetes distintos.
 *
 * El envío se cobra siempre por el peso total real (`ratePerKg`, hoy
 * US$28/kg); la comisión de "Compramos por vos" (si está habilitada) se
 * calcula sobre la suma de precio×cantidad de todas las líneas, sin el
 * mínimo de peso (ese mínimo es solo para el cálculo de envío).
 */
export function calculateQuote(params: {
  isBuyForYou: boolean;
  lines: QuoteLineInput[];
  ratePerKg: number;
  commissionPercent: number;
  commissionEnabled: boolean;
}): QuoteResult {
  const totalWeightKg = round2(
    params.lines.reduce((sum, line) => {
      const lineWeight = Math.max(0, line.quantity) * Math.max(0, line.unitWeightKg);
      const billableLineWeight = lineWeight > 0 ? Math.max(lineWeight, PESO_MINIMO_FACTURABLE_KG) : 0;
      return sum + billableLineWeight;
    }, 0)
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
