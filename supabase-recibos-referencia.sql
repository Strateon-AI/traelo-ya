-- ============================================================
-- Tráelo Ya — referencias de peso para el cotizador público
-- Correr en Supabase (SQL Editor). Idempotente.
-- ============================================================
--
-- warehouse_receipt_items tiene RLS solo para `authenticated`: el cotizador
-- público (anon) no puede leerla, y no debe — trae número de recibo y nombre
-- de archivo, que pueden identificar a la persona que recibió el paquete.
--
-- Esta función expone SOLO descripción, peso y medidas, que es lo único que
-- necesita la IA para estimar. Corre con los permisos de su dueño
-- (security definer), así que no hace falta abrir la tabla ni usar una
-- service-role key en el servidor.
--
-- Sin esta función, el cotizador sigue andando: usa el bloque fijo de las
-- guías de FlyCargo como respaldo.

create or replace function public.warehouse_reference_items(max_items int default 40)
returns table (
  product_description text,
  weight_kg numeric,
  dimensions_cm jsonb
)
language sql
stable
security definer
-- search_path vacío: con security definer, evita que alguien cree una tabla
-- con el mismo nombre en otro schema y la función la lea en vez de la real.
-- La consulta usa nombres completos (public.…), así que no lo necesita.
set search_path = ''
as $$
  select w.product_description, w.weight_kg, w.dimensions_cm
  from public.warehouse_receipt_items w
  order by w.created_at desc
  limit least(greatest(coalesce(max_items, 40), 1), 100);
$$;

revoke all on function public.warehouse_reference_items(int) from public;
grant execute on function public.warehouse_reference_items(int) to anon, authenticated;
