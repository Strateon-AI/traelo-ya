export type ClientType = "card" | "buy-for-you" | "business";

/** Fila de la tabla quote_config (Supabase) — tarifas del cotizador. */
export interface QuoteConfig {
  weightRatePerKg: number;
  commissionPercent: number;
}

/** Fila de la tabla promo (Supabase) — banner de promoción. */
export interface Promo {
  title: string;
  description: string;
  imageUrl: string | null;
  ctaText: string;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
}

/** Fila de la tabla top_products (Supabase) — "Productos más vendidos". */
export interface TopProduct {
  id: string;
  name: string;
  price: number | null;
  imageUrl: string | null;
  sortOrder: number;
  visible: boolean;
}

/** Fila de la tabla instagram_videos (Supabase). */
export interface InstagramVideo {
  id: string;
  videoUrl: string;
  sortOrder: number;
  visible: boolean;
}

/** Forma mínima que necesita el cotizador para sugerir nombres de producto. */
export interface ProductSuggestion {
  id: string;
  name: string;
}
