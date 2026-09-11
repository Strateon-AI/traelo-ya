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

export interface ProductQuoteMessageInput {
  productName: string;
  quantity: number;
  productPrice: number;
  clientTypeLabel: string;
  commissionCost: number;
  weightKg: number;
  shippingCost: number;
  total: number;
  isCommissionApplied: boolean;
}

export function buildProductQuoteMessage(input: ProductQuoteMessageInput): string {
  const lines = [
    "Hola Tráelo Ya 👋",
    "Quiero solicitar una cotización.",
    "",
    `Producto: ${input.productName}`,
    `Cantidad: ${input.quantity}`,
    `Precio del producto: US$ ${input.productPrice.toFixed(2)}`,
    `Modalidad: ${input.clientTypeLabel}`,
  ];

  if (input.isCommissionApplied) {
    lines.push(`Comisión de compra: US$ ${input.commissionCost.toFixed(2)}`);
  }

  lines.push(`Peso estimado: ${input.weightKg} kg`);
  lines.push(`Envío estimado: US$ ${input.shippingCost.toFixed(2)}`);
  lines.push(`Total estimado: US$ ${input.total.toFixed(2)}`);
  lines.push("");
  lines.push(
    "Entiendo que el peso y costo final se confirmarán una vez recibido el producto en almacén."
  );

  return lines.join("\n");
}

export function productQuoteUrl(input: ProductQuoteMessageInput): string {
  return buildWhatsappUrl(buildProductQuoteMessage(input));
}

export interface WeightQuoteMessageInput {
  weightKg: number;
  ratePerKg: number;
  total: number;
}

export function buildWeightQuoteMessage(input: WeightQuoteMessageInput): string {
  const lines = [
    "Hola Tráelo Ya 👋",
    "Quiero solicitar una cotización por peso.",
    "",
    `Peso estimado: ${input.weightKg} kg`,
    `Tarifa referencial: US$ ${input.ratePerKg} por kg`,
    `Total estimado: US$ ${input.total.toFixed(2)}`,
    "",
    "Entiendo que el peso y costo final se confirmarán una vez recibido el producto en almacén.",
  ];
  return lines.join("\n");
}

export function weightQuoteUrl(input: WeightQuoteMessageInput): string {
  return buildWhatsappUrl(buildWeightQuoteMessage(input));
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
