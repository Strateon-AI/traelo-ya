import { createClient } from "@/lib/supabase/server";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <AdminLogin />;
  }

  const [{ data: promo }, { data: quoteConfig }, { data: topProducts }, { data: tiktokVideos }] =
    await Promise.all([
      supabase.from("promo").select("*").eq("id", 1).maybeSingle(),
      supabase.from("quote_config").select("*").eq("id", 1).maybeSingle(),
      supabase.from("top_products").select("*").order("sort_order", { ascending: true }),
      supabase.from("tiktok_videos").select("*").order("sort_order", { ascending: true }),
    ]);

  return (
    <AdminDashboard
      userEmail={user.email ?? ""}
      initialPromo={
        promo
          ? {
              title: promo.title ?? "",
              description: promo.description ?? "",
              imageUrl: promo.image_url,
              ctaText: promo.cta_text ?? "Escríbenos por WhatsApp",
              startsAt: promo.starts_at,
              endsAt: promo.ends_at,
              active: Boolean(promo.active),
            }
          : null
      }
      initialQuoteConfig={
        quoteConfig
          ? {
              weightRatePerKg: Number(quoteConfig.weight_rate_per_kg),
              commissionPercent: Number(quoteConfig.commission_percent),
            }
          : null
      }
      initialTopProducts={(topProducts ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price === null ? null : Number(p.price),
        imageUrl: p.image_url,
        sortOrder: p.sort_order,
        visible: p.visible,
      }))}
      initialTiktokVideos={(tiktokVideos ?? []).map((v) => ({
        id: v.id,
        videoUrl: v.video_url,
        sortOrder: v.sort_order,
        visible: v.visible,
      }))}
    />
  );
}
