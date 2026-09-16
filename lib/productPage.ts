/**
 * Lectura de la página del producto.
 *
 * Amazon bloquea el fetch automatizado, así que para esa tienda hace falta
 * una API de datos de producto (Canopy, Rainforest, ScraperAPI, Oxylabs…).
 * Todo eso queda detrás de esta interfaz: si mañana cambian de proveedor,
 * se toca solo este archivo.
 *
 * Sin `SCRAPER_API_URL` configurada, se intenta un fetch común — que
 * funciona en la mayoría de las tiendas chicas y falla en Amazon. Cuando
 * falla, el cotizador se lo dice al cliente en vez de inventar un número.
 */

export interface ProductPageResult {
  ok: boolean;
  text: string | null;
  /** true cuando la tienda nos bloqueó (captcha, 403, robot check). */
  blocked: boolean;
}

const MAX_CHARS = 14000;
const TIMEOUT_MS = 12000;

/** Palabras que marcan la parte de la página donde están las medidas. */
const KEYWORDS =
  /(package dimension|product dimension|item dimension|shipping weight|item weight|dimensiones|peso del art|peso del prod|weight|dimension)/i;

export async function fetchProductPage(url: string): Promise<ProductPageResult> {
  const scraperUrl = process.env.SCRAPER_API_URL;
  const scraperKey = process.env.SCRAPER_API_KEY;

  if (scraperUrl && scraperKey) {
    return fetchViaScraper(url, scraperUrl, scraperKey);
  }
  return fetchDirect(url);
}

async function fetchDirect(url: string): Promise<ProductPageResult> {
  try {
    const res = await fetchWithTimeout(url, {
      headers: {
        // Sin un User-Agent de navegador, muchas tiendas devuelven una página
        // vacía o un bloqueo directo.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
      },
    });

    if (res.status === 403 || res.status === 429 || res.status === 503) {
      return { ok: false, text: null, blocked: true };
    }
    if (!res.ok) {
      console.error("[productPage] fetchDirect respondió", res.status);
      return { ok: false, text: null, blocked: false };
    }

    const html = await res.text();
    if (looksBlocked(html)) return { ok: false, text: null, blocked: true };

    return { ok: true, text: extractRelevantText(html), blocked: false };
  } catch (err) {
    console.error("[productPage] fetchDirect error:", err instanceof Error ? err.message : err);
    return { ok: false, text: null, blocked: false };
  }
}

/**
 * Formato genérico: `SCRAPER_API_URL` con `{key}` y `{url}` como
 * marcadores. Ejemplo para ScraperAPI:
 *   https://api.scraperapi.com?api_key={key}&url={url}
 */
async function fetchViaScraper(
  url: string,
  template: string,
  key: string
): Promise<ProductPageResult> {
  const endpoint = template
    .replace("{key}", encodeURIComponent(key))
    .replace("{url}", encodeURIComponent(url));

  try {
    const res = await fetchWithTimeout(endpoint, {});
    if (!res.ok) {
      console.error("[productPage] scraper respondió", res.status, (await res.text()).slice(0, 300));
      return { ok: false, text: null, blocked: res.status === 403 };
    }

    const body = await res.text();
    // Algunos proveedores devuelven JSON estructurado y otros el HTML crudo;
    // en los dos casos el texto plano le sirve al modelo.
    return { ok: true, text: extractRelevantText(body), blocked: false };
  } catch (err) {
    console.error("[productPage] scraper error:", err instanceof Error ? err.message : err);
    return { ok: false, text: null, blocked: false };
  }
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function looksBlocked(html: string): boolean {
  const head = html.slice(0, 3000).toLowerCase();
  return (
    head.includes("captcha") ||
    head.includes("are you a robot") ||
    head.includes("enter the characters you see below") ||
    head.includes("access denied")
  );
}

/**
 * Manda la página entera al modelo cuesta tokens y le mete ruido. Se limpia
 * el HTML y, si queda largo, se prioriza el título más las líneas que hablan
 * de medidas o peso — que es lo único que importa acá.
 */
export function extractRelevantText(html: string): string {
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim();

  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const joined = text.join("\n");
  if (joined.length <= MAX_CHARS) {
    return title ? `TÍTULO: ${title}\n\n${joined}` : joined;
  }

  const relevant: string[] = [];
  for (let i = 0; i < text.length; i++) {
    if (KEYWORDS.test(text[i])) {
      relevant.push(...text.slice(Math.max(0, i - 2), i + 6));
    }
  }

  const head = text.slice(0, 120).join("\n");
  const focus = Array.from(new Set(relevant)).join("\n");

  return `TÍTULO: ${title}\n\n${head}\n\n--- MEDIDAS Y PESO ---\n${focus}`.slice(0, MAX_CHARS);
}
