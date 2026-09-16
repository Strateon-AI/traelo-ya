export type ClientType = "card" | "buy-for-you" | "business";

/** Fila de la tabla quote_config (Supabase) — tarifas del cotizador. */
export interface QuoteConfig {
  weightRatePerKg: number;
  commissionPercent: number;
  commissionEnabled: boolean;
  /** Divisor volumétrico del courier (cm³ por kg). Típicamente 5000 o 6000. */
  volumetricDivisor: number;
}

/** De dónde salió la estimación de peso — define cuánta confianza darle. */
export type WeightEstimateSource =
  | "pagina"
  | "producto_mas_embalaje"
  | "estimado"
  | "sin_datos";

/** Estimación de peso de envío a partir del link de un producto. */
export interface WeightEstimate {
  producto: string | null;
  tienda: string | null;
  dimensionesCm: { largo: number; ancho: number; alto: number } | null;
  pesoRealKg: number | null;
  pesoVolumetricoKg: number | null;
  pesoCobrableKg: { min: number; max: number } | null;
  fuente: WeightEstimateSource;
  confianza: "alta" | "media" | "baja";
  nota: string | null;
}

/** Fila de la tabla weight_estimates (Supabase), para el panel. */
export interface StoredWeightEstimate extends WeightEstimate {
  id: string;
  url: string;
  createdAt: string;
  /** Lo que marcó la balanza en el almacén. Lo carga el admin a mano. */
  pesoMedidoKg: number | null;
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
