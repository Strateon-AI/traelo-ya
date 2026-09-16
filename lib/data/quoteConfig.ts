import { createPublicClient } from "@/lib/supabase/public";
import { DEFAULT_VOLUMETRIC_DIVISOR } from "@/lib/weightEstimate";
import type { QuoteConfig } from "@/lib/types";

const FALLBACK_CONFIG: QuoteConfig = {
  weightRatePerKg: 28,
  commissionPercent: 5,
  commissionEnabled: true,
  volumetricDivisor: DEFAULT_VOLUMETRIC_DIVISOR,
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
    volumetricDivisor:
      Number(data.volumetric_divisor) > 0
        ? Number(data.volumetric_divisor)
        : DEFAULT_VOLUMETRIC_DIVISOR,
  };
}
