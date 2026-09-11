import { createPublicClient } from "@/lib/supabase/public";
import type { Promo } from "@/lib/types";

const FALLBACK_PROMO: Promo = {
  title: "",
  description: "",
  imageUrl: null,
  ctaText: "Escríbenos por WhatsApp",
  startsAt: null,
  endsAt: null,
  active: false,
};

export async function getPromo(): Promise<Promo> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("promo").select("*").eq("id", 1).maybeSingle();

  if (error || !data) return FALLBACK_PROMO;

  return {
    title: data.title ?? "",
    description: data.description ?? "",
    imageUrl: data.image_url,
    ctaText: data.cta_text ?? "Escríbenos por WhatsApp",
    startsAt: data.starts_at,
    endsAt: data.ends_at,
    active: Boolean(data.active),
  };
}

/**
 * Calcula el estado real de la promo en el momento del render (nunca al
 * guardar) — mismo criterio que la vigencia de ofertas de La Tienda:
 * - sin fechas → vigente mientras `active` esté prendido
 * - solo inicio → arranca sola en esa fecha, sin vencimiento
 * - solo fin → vigente desde ya, vence sola
 * - ambas → vigente solo dentro del rango
 */
export function getPromoStatus(promo: Promo, now: Date = new Date()): "vigente" | "programada" | "vencida" | "inactiva" {
  if (!promo.active) return "inactiva";

  const starts = promo.startsAt ? new Date(promo.startsAt) : null;
  const ends = promo.endsAt ? new Date(promo.endsAt) : null;

  if (starts && now < starts) return "programada";
  if (ends && now > ends) return "vencida";
  return "vigente";
}
