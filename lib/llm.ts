/**
 * Llamada al modelo sin SDK: los dos proveedores son una sola petición HTTP,
 * y así el proyecto no suma dependencias nuevas.
 *
 * El proveedor se elige solo según qué API key esté configurada, así que
 * pasar de OpenAI a Claude (o al revés) es cambiar una variable de entorno,
 * sin tocar código. El modelo también es configurable por si la versión por
 * defecto queda vieja.
 */

export interface LlmResult {
  ok: boolean;
  text: string | null;
  error: string | null;
}

const TIMEOUT_MS = 45000;
/**
 * La búsqueda web hace varias vueltas (buscar, leer resultados, a veces
 * repetir), así que necesita más margen que una llamada normal — pero sigue
 * acotado para no comerse todo el maxDuration de la función junto con el
 * intento de leer la página que ya falló antes de llegar acá.
 */
const SEARCH_TIMEOUT_MS = 28000;

export function llmConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
}

/** true solo si Anthropic está configurado — la búsqueda web es específica de esa API. */
export function searchConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function askModel(systemPrompt: string, userContent: string): Promise<LlmResult> {
  if (process.env.ANTHROPIC_API_KEY) {
    return askAnthropic(systemPrompt, userContent);
  }
  if (process.env.OPENAI_API_KEY) {
    return askOpenAi(systemPrompt, userContent);
  }
  return { ok: false, text: null, error: "No hay API key de modelo configurada." };
}

/**
 * Igual que askModel, pero con la herramienta de búsqueda web de Anthropic
 * habilitada. Se usa cuando no se pudo leer la página del producto — en vez
 * de tirar un error, el modelo busca el producto por nombre en la web.
 * Solo funciona con Anthropic (OpenAI necesita una integración distinta que
 * no está armada); si solo hay OPENAI_API_KEY, el caller debe manejar el
 * error y caer al mensaje de siempre.
 */
export async function askModelWithSearch(
  systemPrompt: string,
  userContent: string
): Promise<LlmResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      ok: false,
      text: null,
      error: "La búsqueda por nombre necesita ANTHROPIC_API_KEY configurada.",
    };
  }

  try {
    const res = await withTimeout(
      fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY as string,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
          max_tokens: 1536,
          temperature: 0.1,
          system: systemPrompt,
          messages: [{ role: "user", content: userContent }],
          tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }],
        }),
      }),
      SEARCH_TIMEOUT_MS
    );

    if (!res.ok) {
      const body = await res.text();
      return {
        ok: false,
        text: null,
        error: `Anthropic (búsqueda) respondió ${res.status}: ${body.slice(0, 300)}`,
      };
    }

    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };

    // Con la herramienta de búsqueda, la respuesta trae varios bloques
    // (las búsquedas que hizo, sus resultados, y el texto final). El texto
    // final con el JSON que nos interesa es el ÚLTIMO bloque de tipo "text".
    const textBlocks = (data.content ?? []).filter(
      (block) => block.type === "text" && typeof block.text === "string"
    );
    const text = textBlocks.length > 0 ? (textBlocks[textBlocks.length - 1].text ?? null) : null;

    return text
      ? { ok: true, text, error: null }
      : { ok: false, text: null, error: "Respuesta vacía del modelo (búsqueda)." };
  } catch (err) {
    return {
      ok: false,
      text: null,
      error: err instanceof Error ? err.message : "No se pudo contactar al modelo (búsqueda).",
    };
  }
}

async function askAnthropic(systemPrompt: string, userContent: string): Promise<LlmResult> {
  try {
    const res = await withTimeout(
      fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY as string,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          temperature: 0.1,
          system: systemPrompt,
          messages: [{ role: "user", content: userContent }],
        }),
      }),
      TIMEOUT_MS
    );

    if (!res.ok) return { ok: false, text: null, error: `Anthropic respondió ${res.status}` };

    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = data.content?.find((block) => block.type === "text")?.text ?? null;
    return text
      ? { ok: true, text, error: null }
      : { ok: false, text: null, error: "Respuesta vacía del modelo." };
  } catch {
    return { ok: false, text: null, error: "No se pudo contactar al modelo." };
  }
}

async function askOpenAi(systemPrompt: string, userContent: string): Promise<LlmResult> {
  try {
    const res = await withTimeout(
      fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${process.env.OPENAI_API_KEY as string}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          temperature: 0.1,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
        }),
      }),
      TIMEOUT_MS
    );

    if (!res.ok) return { ok: false, text: null, error: `OpenAI respondió ${res.status}` };

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content ?? null;
    return text
      ? { ok: true, text, error: null }
      : { ok: false, text: null, error: "Respuesta vacía del modelo." };
  } catch {
    return { ok: false, text: null, error: "No se pudo contactar al modelo." };
  }
}

async function withTimeout(promise: Promise<Response>, timeoutMs: number = TIMEOUT_MS): Promise<Response> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("timeout")), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
