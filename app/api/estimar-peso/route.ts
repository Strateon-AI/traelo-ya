import { NextResponse } from "next/server";
import { getQuoteConfig } from "@/lib/data/quoteConfig";
import {
  findCachedEstimate,
  isValidProductUrl,
  saveEstimate,
} from "@/lib/data/weightEstimates";
import { askModel, askModelWithSearch, llmConfigured, searchConfigured } from "@/lib/llm";
import { fetchProductPage } from "@/lib/productPage";
import {
  buildWeightPrompt,
  buildWeightSearchPrompt,
  parseWeightEstimate,
} from "@/lib/weightEstimate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Freno mínimo de abuso: este endpoint es público y cada llamada que llega al
 * modelo cuesta plata. En serverless la memoria no se comparte entre
 * instancias, así que esto no es una defensa seria — es para que un solo
 * navegador no dispare cien consultas seguidas. Si el volumen crece, conviene
 * moverlo a una tabla de Supabase o a un servicio de rate limiting.
 */
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

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconocido";

  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Demasiadas consultas seguidas. Esperá un momento." },
      { status: 429 }
    );
  }

  let url: string;
  let productName: string;
  try {
    const body = (await request.json()) as { url?: unknown; productName?: unknown };
    url = typeof body.url === "string" ? body.url.trim() : "";
    productName = typeof body.productName === "string" ? body.productName.trim() : "";
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 });
  }

  if (!isValidProductUrl(url)) {
    return NextResponse.json({ error: "Ese link no parece válido." }, { status: 400 });
  }

  // 1. Caché: si ya se cotizó este producto, sale instantáneo y gratis.
  const cached = await findCachedEstimate(url);
  if (cached) {
    return NextResponse.json({ estimate: cached, cached: true });
  }

  if (!llmConfigured()) {
    return NextResponse.json(
      {
        error:
          "La estimación automática todavía no está configurada. Cargá el peso a mano por ahora.",
        needsSetup: true,
      },
      { status: 503 }
    );
  }

  // 2. Leer la página del producto.
  const page = await fetchProductPage(url);
  const config = await getQuoteConfig();

  let result;
  if (page.ok && page.text) {
    // Camino normal: se pudo leer la página.
    const prompt = buildWeightPrompt(config.volumetricDivisor);
    result = await askModel(prompt, `LINK: ${url}\n\nCONTENIDO DE LA PÁGINA:\n${page.text}`);
  } else if (productName && searchConfigured()) {
    // Fallback: la tienda bloqueó la lectura (Best Buy, eBay…), pero tenemos
    // el nombre del producto — que ya es un campo obligatorio del cotizador
    // — así que el modelo busca en la web en vez de depender de esa página
    // puntual. No importa si el bloqueo fue por captcha, timeout o lo que
    // sea: mientras haya nombre, se intenta.
    const searchPrompt = buildWeightSearchPrompt(config.volumetricDivisor);
    result = await askModelWithSearch(
      searchPrompt,
      `PRODUCTO: ${productName}\nTIENDA (no se pudo leer la página): ${url}`
    );
  } else {
    // Sin página legible y sin nombre (o sin Anthropic configurado para
    // buscar) — acá sí no hay nada más que intentar.
    return NextResponse.json(
      {
        error: page.blocked
          ? "Esa tienda no nos deja leer la página automáticamente."
          : "No pudimos leer la página del producto.",
        blocked: page.blocked,
      },
      { status: 422 }
    );
  }

  if (!result.ok || !result.text) {
    console.error("[estimar-peso] llm error:", result.error);
    return NextResponse.json(
      { error: "No pudimos calcular el peso en este momento." },
      { status: 502 }
    );
  }

  const estimate = parseWeightEstimate(result.text, config.volumetricDivisor);
  if (!estimate || estimate.fuente === "sin_datos" || !estimate.pesoCobrableKg) {
    return NextResponse.json(
      { error: "No pudimos identificar el producto en ese link." },
      { status: 422 }
    );
  }

  // 3. Guardar para la próxima y para poder comparar después contra el peso real.
  await saveEstimate(url, estimate);

  return NextResponse.json({ estimate, cached: false });
}
