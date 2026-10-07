import { NextResponse } from "next/server";
import { getQuoteConfig } from "@/lib/data/quoteConfig";
import { getReferenceDataBlock } from "@/lib/data/warehouseReceipts";
import { askModelWithImage, searchConfigured } from "@/lib/llm";
import { buildScreenshotPrompt, parseScreenshotEstimate } from "@/lib/weightEstimate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Tiene que vencer antes que maxDuration: si no, Vercel corta la función y
 * el cliente recibe un 504 genérico en vez de nuestro mensaje.
 */
const LLM_TIMEOUT_MS = 25_000;

/** ~3 MB de imagen. El navegador ya la comprime a 1600px/JPEG antes de mandarla. */
const MAX_IMAGE_BASE64 = 4_000_000;
const ALLOWED_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const HITS = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (HITS.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  HITS.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

/**
 * El cliente manda una captura de la página del producto en vez del link.
 * Se lee nombre y precio de la imagen, y el peso se estima por categoría.
 */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconocido";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Demasiadas consultas seguidas. Esperá un momento." }, { status: 429 });
  }

  let imageBase64: string;
  let mediaType: string;
  try {
    const body = (await request.json()) as { imageBase64?: unknown; mediaType?: unknown };
    imageBase64 = typeof body.imageBase64 === "string" ? body.imageBase64 : "";
    mediaType = typeof body.mediaType === "string" ? body.mediaType : "";
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 });
  }

  if (!imageBase64 || !ALLOWED_MEDIA_TYPES.has(mediaType)) {
    return NextResponse.json({ error: "Imagen inválida — usá JPG, PNG o WEBP." }, { status: 400 });
  }
  if (imageBase64.length > MAX_IMAGE_BASE64) {
    return NextResponse.json({ error: "La imagen es muy grande. Probá con una captura más chica." }, { status: 400 });
  }
  if (!searchConfigured()) {
    return NextResponse.json({ error: "Leer capturas todavía no está configurado." }, { status: 503 });
  }

  const [config, referenceData] = await Promise.all([getQuoteConfig(), getReferenceDataBlock()]);
  const prompt = buildScreenshotPrompt(config.volumetricDivisor, referenceData);
  const result = await askModelWithImage(prompt, imageBase64, mediaType, LLM_TIMEOUT_MS);

  if (!result.ok || !result.text) {
    console.error("[estimar-desde-imagen] llm error:", result.error);
    return NextResponse.json({ error: "No pudimos leer la captura en este momento." }, { status: 502 });
  }

  const estimate = parseScreenshotEstimate(result.text);
  if (!estimate || estimate.fuente === "sin_datos" || !estimate.pesoCobrableKg) {
    return NextResponse.json({ error: "No pudimos identificar el producto en esa captura." }, { status: 422 });
  }

  return NextResponse.json({ estimate });
}
