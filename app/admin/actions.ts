"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { supabase, error: "Sesión vencida. Volvé a iniciar sesión." } as const;
  }
  return { supabase, error: null } as const;
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export async function uploadImage(formData: FormData): Promise<{ url: string | null; error: string | null }> {
  const { supabase, error } = await requireSession();
  if (error) return { url: null, error };

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { url: null, error: "No se recibió ningún archivo." };
  if (file.size > 2 * 1024 * 1024) return { url: null, error: "La imagen pesa más de 2 MB." };

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("fotos").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) return { url: null, error: uploadError.message };

  const { data } = supabase.storage.from("fotos").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

export async function updateQuoteConfig(input: { weightRatePerKg: number; commissionPercent: number }) {
  const { supabase, error } = await requireSession();
  if (error) return { error };

  const { error: dbError } = await supabase
    .from("quote_config")
    .update({
      weight_rate_per_kg: input.weightRatePerKg,
      commission_percent: input.commissionPercent,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (dbError) return { error: dbError.message };
  revalidatePath("/");
  return { error: null };
}

export async function updatePromo(input: {
  title: string;
  description: string;
  imageUrl: string | null;
  ctaText: string;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
}) {
  const { supabase, error } = await requireSession();
  if (error) return { error };

  const { error: dbError } = await supabase
    .from("promo")
    .update({
      title: input.title,
      description: input.description,
      image_url: input.imageUrl,
      cta_text: input.ctaText,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      active: input.active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (dbError) return { error: dbError.message };
  revalidatePath("/");
  return { error: null };
}

export async function upsertTopProduct(input: {
  id: string | null;
  name: string;
  price: number | null;
  imageUrl: string | null;
  sortOrder: number;
  visible: boolean;
}) {
  const { supabase, error } = await requireSession();
  if (error) return { error };

  const row = {
    name: input.name,
    price: input.price,
    image_url: input.imageUrl,
    sort_order: input.sortOrder,
    visible: input.visible,
    updated_at: new Date().toISOString(),
  };

  const { error: dbError } = input.id
    ? await supabase.from("top_products").update(row).eq("id", input.id)
    : await supabase.from("top_products").insert(row);

  if (dbError) return { error: dbError.message };
  revalidatePath("/");
  return { error: null };
}

export async function deleteTopProduct(id: string) {
  const { supabase, error } = await requireSession();
  if (error) return { error };

  const { error: dbError } = await supabase.from("top_products").delete().eq("id", id);
  if (dbError) return { error: dbError.message };
  revalidatePath("/");
  return { error: null };
}

export async function upsertTiktokVideo(input: {
  id: string | null;
  videoUrl: string;
  sortOrder: number;
  visible: boolean;
}) {
  const { supabase, error } = await requireSession();
  if (error) return { error };

  const row = {
    video_url: input.videoUrl,
    sort_order: input.sortOrder,
    visible: input.visible,
  };

  const { error: dbError } = input.id
    ? await supabase.from("tiktok_videos").update(row).eq("id", input.id)
    : await supabase.from("tiktok_videos").insert(row);

  if (dbError) return { error: dbError.message };
  revalidatePath("/");
  return { error: null };
}

export async function deleteTiktokVideo(id: string) {
  const { supabase, error } = await requireSession();
  if (error) return { error };

  const { error: dbError } = await supabase.from("tiktok_videos").delete().eq("id", id);
  if (dbError) return { error: dbError.message };
  revalidatePath("/");
  return { error: null };
}
