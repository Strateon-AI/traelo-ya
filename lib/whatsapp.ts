export const WHATSAPP_DISPLAY_NUMBER = "73189844";
export const WHATSAPP_INTERNATIONAL_NUMBER = "59173189844";

function buildWhatsappUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_INTERNATIONAL_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function genericContactUrl(): string {
  return buildWhatsappUrl("Hola Tráelo Ya 👋\nQuiero más información sobre sus envíos desde Estados Unidos.");
}

export function catalogInquiryUrl(): string {
  return buildWhatsappUrl("Hola Tráelo Ya 👋\nQuiero ver el catálogo completo de productos disponibles.");
}

export function customProductInquiryUrl(): string {
  return buildWhatsappUrl(
    "Hola Tráelo Ya 👋\nQuiero cotizar un producto que no está en la lista. Les paso el link de la tienda:"
  );
}

export interface QuoteLineMessageInput {
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface QuoteMessageInput {
  lines: QuoteLineMessageInput[];
  clientTypeLabel: string;
  isBuyForYou: boolean;
  commissionEnabled: boolean;
  commissionPercent: number;
  commissionCost: number;
  totalWeightKg: number;
  shippingCost: number;
  total: number;
  orderCode?: string;
}

export function buildQuoteMessage(input: QuoteMessageInput): string {
  const lines = ["Hola Tráelo Ya 👋", "Quiero solicitar una cotización.", ""];

  if (input.orderCode) {
    lines.push(`Código de cotización: ${input.orderCode}`);
    lines.push("");
  }

  const namedLines = input.lines.filter((line) => line.productName.trim().length > 0);
  if (namedLines.length > 0) {
    lines.push("Productos:");
    namedLines.forEach((line) => {
      const priceText = line.unitPrice > 0 ? ` — US$ ${line.unitPrice.toFixed(2)} c/u` : "";
      lines.push(`• ${line.productName} (x${line.quantity})${priceText}`);
    });
    lines.push("");
  }

  lines.push(`Modalidad: ${input.clientTypeLabel}`);
  if (input.isBuyForYou) {
    if (input.commissionEnabled) {
      lines.push(`Comisión de compra (${input.commissionPercent}%): US$ ${input.commissionCost.toFixed(2)}`);
    } else {
      lines.push(
        `(Incluye comisión de compra del ${input.commissionPercent}% sobre el precio del producto — a coordinar)`
      );
    }
  }
  lines.push(`Peso total estimado: ${input.totalWeightKg} kg`);
  lines.push(`Envío estimado: US$ ${input.shippingCost.toFixed(2)}`);
  lines.push(`Total estimado: US$ ${input.total.toFixed(2)}`);
  lines.push("");
  lines.push(
    "Entiendo que el peso y costo final se confirmarán una vez recibido el producto en almacén."
  );

  return lines.join("\n");
}

export function quoteUrl(input: QuoteMessageInput): string {
  return buildWhatsappUrl(buildQuoteMessage(input));
}

export interface BusinessQuoteMessageInput {
  product?: string;
  approxQuantity?: string;
  approxValue?: string;
  frequency?: string;
}

export function buildBusinessQuoteMessage(input: BusinessQuoteMessageInput = {}): string {
  const lines = [
    "Hola Tráelo Ya 👋",
    "Quiero solicitar una tarifa preferencial para comercio.",
    "",
    `Producto: ${input.product ?? ""}`,
    `Cantidad aproximada: ${input.approxQuantity ?? ""}`,
    `Valor aproximado de compra: ${input.approxValue ?? ""}`,
    `Frecuencia de importación: ${input.frequency ?? ""}`,
  ];
  return lines.join("\n");
}

export function businessQuoteUrl(input?: BusinessQuoteMessageInput): string {
  return buildWhatsappUrl(buildBusinessQuoteMessage(input));
}

export function trackingHelpUrl(orderCode: string): string {
  return buildWhatsappUrl(
    `Hola Tráelo Ya 👋\nNo encuentro mi código de pedido. ¿Me ayudan a rastrearlo? (${orderCode || "sin código"})`
  );
}

export function orderStatusUrl(): string {
  return buildWhatsappUrl(
    "Hola Tráelo Ya 👋\nQuiero saber el estado de mi pedido.\nCódigo de pedido (si lo tengo): "
  );
}
