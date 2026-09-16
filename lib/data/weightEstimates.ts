import { createPublicClient } from "@/lib/supabase/public";
import type { StoredWeightEstimate, WeightEstimate } from "@/lib/types";

/**
 * Los links de Amazon vienen con un montón de basura de tracking, y el mismo
 * producto llega escrito de diez formas distintas. Se normaliza a una clave
 * estable para que la caché sirva de verdad: en Amazon, el ASIN; en el resto,
 * host + path sin query.
 */
export function urlKey(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    if (host.includes("amazon.")) {
      const asin = url.pathname.match(/\/(?:dp|gp\/product|product)\/([A-Z0-9]{10})/i)?.[1];
      if (asin) return `amazon:${asin.toUpperCase()}`;
    }

    return `${host}${url.pathname.replace(/\/+$/, "")}`.toLowerCase();
  } catch {
    return rawUrl.trim().toLowerCase();
  }
}

export function isValidProductUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Si el link ya se cotizó antes, se reusa: sale al instante y no gasta consulta. */
export async function findCachedEstimate(rawUrl: string): Promise<WeightEstimate | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("weight_estimates")
    .select("*")
    .eq("url_key", urlKey(rawUrl))
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return rowToEstimate(data);
}

export async function saveEstimate(rawUrl: string, estimate: WeightEstimate): Promise<void> {
  if (estimate.fuente === "sin_datos") return;

  const supabase = createPublicClient();
  await supabase.from("weight_estimates").insert({
    url: rawUrl,
    url_key: urlKey(rawUrl),
    producto: estimate.producto,
    tienda: estimate.tienda,
    largo_cm: estimate.dimensionesCm?.largo ?? null,
    ancho_cm: estimate.dimensionesCm?.ancho ?? null,
    alto_cm: estimate.dimensionesCm?.alto ?? null,
    peso_real_kg: estimate.pesoRealKg,
    peso_volumetrico_kg: estimate.pesoVolumetricoKg,
    peso_cobrable_min_kg: estimate.pesoCobrableKg?.min ?? null,
    peso_cobrable_max_kg: estimate.pesoCobrableKg?.max ?? null,
    fuente: estimate.fuente,
    confianza: estimate.confianza,
    nota: estimate.nota,
  });
}

/** Para el panel: las estimaciones guardadas, con el peso real si ya se cargó. */
export async function listStoredEstimates(limit = 100): Promise<StoredWeightEstimate[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("weight_estimates")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row) => ({
    id: String(row.id),
    url: String(row.url),
    createdAt: String(row.created_at),
    pesoMedidoKg: row.peso_real_medido_kg === null ? null : Number(row.peso_real_medido_kg),
    ...rowToEstimate(row),
  }));
}

function rowToEstimate(row: Record<string, unknown>): WeightEstimate {
  const largo = numberOrNull(row.largo_cm);
  const ancho = numberOrNull(row.ancho_cm);
  const alto = numberOrNull(row.alto_cm);
  const min = numberOrNull(row.peso_cobrable_min_kg);
  const max = numberOrNull(row.peso_cobrable_max_kg);

  return {
    producto: textOrNull(row.producto),
    tienda: textOrNull(row.tienda),
    dimensionesCm: largo && ancho && alto ? { largo, ancho, alto } : null,
    pesoRealKg: numberOrNull(row.peso_real_kg),
    pesoVolumetricoKg: numberOrNull(row.peso_volumetrico_kg),
    pesoCobrableKg: min && max ? { min, max } : null,
    fuente: (row.fuente as WeightEstimate["fuente"]) ?? "estimado",
    confianza: (row.confianza as WeightEstimate["confianza"]) ?? "baja",
    nota: textOrNull(row.nota),
  };
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function textOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}
