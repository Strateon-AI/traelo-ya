import { createPublicClient } from "@/lib/supabase/public";
import type { TopProduct } from "@/lib/types";

export async function getTopProducts(): Promise<TopProduct[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("top_products")
    .select("*")
    .eq("visible", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    price: row.price === null ? null : Number(row.price),
    imageUrl: row.image_url,
    sortOrder: row.sort_order,
    visible: row.visible,
  }));
}
