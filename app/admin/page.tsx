import { createClient } from "@/lib/supabase/server";
import { listStoredEstimates } from "@/lib/data/weightEstimates";
import { DEFAULT_VOLUMETRIC_DIVISOR } from "@/lib/weightEstimate";
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

  const [
    { data: promo },
    { data: quoteConfig },
    { data: topProducts },
    { data: instagramVideos },
    weightEstimates,
    { data: orders },
  ] = await Promise.all([
    supabase.from("promo").select("*").eq("id", 1).maybeSingle(),
    supabase.from("quote_config").select("*").eq("id", 1).maybeSingle(),
    supabase.from("top_products").select("*").order("sort_order", { ascending: true }),
    supabase.from("instagram_videos").select("*").order("sort_order", { ascending: true }),
    listStoredEstimates(),
    supabase.from("orders").select("*").order("created_at", { ascending: false }),
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
              commissionEnabled: Boolean(quoteConfig.commission_enabled),
              volumetricDivisor:
                Number(quoteConfig.volumetric_divisor) > 0
                  ? Number(quoteConfig.volumetric_divisor)
                  : DEFAULT_VOLUMETRIC_DIVISOR,
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
      initialInstagramVideos={(instagramVideos ?? []).map((v) => ({
        id: v.id,
        videoUrl: v.video_url,
        sortOrder: v.sort_order,
        visible: v.visible,
      }))}
      initialWeightEstimates={weightEstimates}
      initialOrders={(orders ?? []).map((o) => ({
        id: o.id,
        customerName: o.customer_name ?? "",
        customerWhatsapp: o.customer_whatsapp ?? "",
        lines: Array.isArray(o.lines) ? o.lines : [],
        totalWeightKg: Number(o.total_weight_kg) || 0,
        shippingCost: Number(o.shipping_cost) || 0,
        commissionCost: Number(o.commission_cost) || 0,
        total: Number(o.total) || 0,
        status: o.status ?? "pending",
        createdAt: o.created_at,
      }))}
    />
  );
}
