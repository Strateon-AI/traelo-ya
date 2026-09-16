import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface OrderLineInput {
  productName: string;
  quantity: number;
  unitPrice: number;
}

/**
 * Guarda cada pedido que arma el cotizador, se llegue o no a mandar el
 * WhatsApp del otro lado — así queda un registro real en /admin en vez de
 * depender de que el cliente efectivamente apriete "enviar" en su WhatsApp.
 * El aviso a Telegram es best-effort: si falla, el pedido ya quedó guardado
 * igual y sigue siendo visible en el panel.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 });
  }

  const customerName = typeof body.customerName === "string" ? body.customerName.trim() : "";
  const customerWhatsapp =
    typeof body.customerWhatsapp === "string" ? body.customerWhatsapp.trim() : "";

  if (!customerName || !customerWhatsapp) {
    return NextResponse.json({ error: "Faltan tus datos de contacto." }, { status: 400 });
  }

  const lines: OrderLineInput[] = Array.isArray(body.lines)
    ? (body.lines as OrderLineInput[]).filter(
        (line) => line && typeof line === "object" && typeof line.quantity === "number"
      )
    : [];

  const clientType = typeof body.clientType === "string" ? body.clientType : "card";
  const totalWeightKg = Number(body.totalWeightKg) || 0;
  const shippingCost = Number(body.shippingCost) || 0;
  const commissionCost = Number(body.commissionCost) || 0;
  const total = Number(body.total) || 0;

  const supabase = createPublicClient();
  const { error } = await supabase.from("orders").insert({
    customer_name: customerName,
    customer_whatsapp: customerWhatsapp,
    client_type: clientType,
    lines,
    total_weight_kg: totalWeightKg,
    shipping_cost: shippingCost,
    commission_cost: commissionCost,
    total,
  });

  if (error) {
    console.error("[registrar-pedido] insert error:", error);
    return NextResponse.json({ error: "No pudimos guardar el pedido." }, { status: 500 });
  }

  notifyTelegram({ customerName, customerWhatsapp, lines, totalWeightKg, total }).catch((err) => {
    console.error("[registrar-pedido] telegram error:", err);
  });

  return NextResponse.json({ ok: true });
}

async function notifyTelegram(order: {
  customerName: string;
  customerWhatsapp: string;
  lines: OrderLineInput[];
  totalWeightKg: number;
  total: number;
}): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const productLines = order.lines
    .filter((line) => line.productName?.trim())
    .map((line) => `• ${line.productName} (x${line.quantity})`)
    .join("\n");

  const text = [
    "🆕 Nuevo pedido en Tráelo Ya",
    "",
    `Cliente: ${order.customerName}`,
    `WhatsApp: ${order.customerWhatsapp}`,
    productLines ? `\nProductos:\n${productLines}` : "",
    `\nPeso total: ${order.totalWeightKg} kg`,
    `Total estimado: US$ ${order.total.toFixed(2)}`,
  ]
    .filter((line) => line !== "")
    .join("\n");

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  if (!res.ok) {
    console.error("[registrar-pedido] telegram respondió", res.status, await res.text());
  }
}
