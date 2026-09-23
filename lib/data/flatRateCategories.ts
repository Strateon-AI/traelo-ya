import { createPublicClient } from "@/lib/supabase/public";
import type { FlatRateCategory } from "@/lib/types";

/**
 * Sin datos en Supabase (tabla caída, red, lo que sea), el cotizador sigue
 * andando igual: estas categorías simplemente no aparecen como opción y
 * todos los productos se cotizan por peso, como si la función no existiera.
 */
export async function getFlatRateCategories(): Promise<FlatRateCategory[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("flat_rate_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    label: row.label,
    priceUsd: Number(row.price_usd) || 0,
  }));
}
