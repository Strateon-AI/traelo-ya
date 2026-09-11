import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/**
 * Cliente de solo lectura para las páginas públicas — sin cookies. Usar
 * `cookies()` (como hace lib/supabase/server.ts) fuerza a Next.js a
 * renderizar la página siempre dinámica, ignorando el `revalidate` de
 * app/page.tsx. Este cliente evita eso: la home puede cachearse por ISR
 * y refrescarse cada 60s como corresponde. El panel /admin sigue usando
 * el cliente con cookies, porque ahí sí hace falta la sesión.
 */
export function createPublicClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
}
