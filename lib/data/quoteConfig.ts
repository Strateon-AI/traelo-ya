import { createPublicClient } from "@/lib/supabase/public";
import type { QuoteConfig } from "@/lib/types";

const FALLBACK_CONFIG: QuoteConfig = {
  weightRatePerKg: 28,
  commissionPercent: 5,
  commissionEnabled: true,
};

export async function getQuoteConfig(): Promise<QuoteConfig> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("quote_config")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) return FALLBACK_CONFIG;

  return {
    weightRatePerKg: Number(data.weight_rate_per_kg),
    commissionPercent: Number(data.commission_percent),
    commissionEnabled: Boolean(data.commission_enabled),
  };
}
