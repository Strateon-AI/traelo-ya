-- ============================================================
-- Tráelo Ya — estimación de peso por link
-- Correr en Supabase (SQL Editor) antes de desplegar.
-- ============================================================

-- 1. Divisor volumétrico configurable desde /admin.
--    El valor real lo define el courier con el que trabajan: típicamente
--    5000 o 6000 para cm³/kg. 5000 queda como default hasta que lo confirmen.
alter table public.quote_config
  add column if not exists volumetric_divisor numeric not null default 5000;

-- 2. Estimaciones guardadas por link.
create table if not exists public.weight_estimates (
  id                    uuid primary key default gen_random_uuid(),
  url                   text not null,
  -- Clave normalizada: en Amazon el ASIN, en el resto host+path sin query.
  -- Es lo que hace que la caché sirva: el mismo producto llega escrito de
  -- mil formas distintas.
  url_key               text not null,
  producto              text,
  tienda                text,
  largo_cm              numeric,
  ancho_cm              numeric,
  alto_cm               numeric,
  peso_real_kg          numeric,   -- peso del producto según la estimación
  peso_volumetrico_kg   numeric,
  peso_cobrable_min_kg  numeric,
  peso_cobrable_max_kg  numeric,
  fuente                text,      -- pagina | producto_mas_embalaje | estimado
  confianza             text,      -- alta | media | baja
  nota                  text,
  -- El dato que vale: lo que marcó la balanza en el almacén. Lo carga el
  -- admin a mano. Sin esto el sistema nunca aprende.
  peso_real_medido_kg   numeric,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists weight_estimates_url_key_idx
  on public.weight_estimates (url_key, created_at desc);

-- 3. RLS
alter table public.weight_estimates enable row level security;

-- Lectura pública: el cotizador necesita revisar la caché antes de gastar
-- una consulta paga al modelo.
drop policy if exists "weight_estimates_select_public" on public.weight_estimates;
create policy "weight_estimates_select_public"
  on public.weight_estimates for select
  to anon, authenticated
  using (true);

-- Inserción pública: la ruta /api/estimar-peso corre en el servidor pero usa
-- la llave anon. Es un vector de spam conocido; hoy está contenido por la
-- caché y el rate limit del endpoint. Si el volumen crece, conviene mover
-- esta escritura a una service-role key guardada solo en el servidor.
drop policy if exists "weight_estimates_insert_public" on public.weight_estimates;
create policy "weight_estimates_insert_public"
  on public.weight_estimates for insert
  to anon, authenticated
  with check (true);

-- El peso real solo lo carga alguien logueado en /admin.
drop policy if exists "weight_estimates_update_admin" on public.weight_estimates;
create policy "weight_estimates_update_admin"
  on public.weight_estimates for update
  to authenticated
  using (true)
  with check (true);
