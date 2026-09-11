/**
 * URL y llave pública (anon/publishable) del proyecto Supabase de Tráelo
 * Ya. Ninguna de las dos es secreta — la protección real es RLS (ver las
 * migraciones en Supabase), no ocultar estos valores. Se pueden
 * sobreescribir con variables de entorno si el proyecto de Supabase
 * cambia; si no están seteadas, se usan estas por defecto para que el
 * build no dependa de configurar nada en Vercel.
 */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uxuwxmpgoiciqguapovv.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_opRlek0A8pLuAYAev-at6w_m52-Mu7f";
