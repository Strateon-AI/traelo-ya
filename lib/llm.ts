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

export function llmConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
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
          model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest",
          max_tokens: 1024,
          temperature: 0.1,
          system: systemPrompt,
          messages: [{ role: "user", content: userContent }],
        }),
      })
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
      })
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

async function withTimeout(promise: Promise<Response>): Promise<Response> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
