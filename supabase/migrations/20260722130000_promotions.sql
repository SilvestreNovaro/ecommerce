-- ============================================================================
-- Nalika · Rediseño — Módulo 4: Promociones + modelo de precios (patrón SUK)
-- ----------------------------------------------------------------------------
-- - promotions: descuentos automáticos (porcentaje, monto fijo, NxM, cantidad
--   mínima) con alcance 'todo', 'producto' o 'categoria' (adaptación Nalika:
--   SUK no tiene categorías; acá las subcategorías HEREDAN la promo del padre).
-- - store_settings (single-row): % de descuento por transferencia GLOBAL +
--   flag para activarlo/desactivarlo. Se aplica sobre el precio vigente
--   (promocional si hay oferta, o el normal).
-- - orders.promo_discount / transfer_discount: desglose de descuentos de la
--   orden (montos integer en pesos, como todos los precios de Nalika).
-- ============================================================================

do $$ begin
  create type promo_tipo as enum ('porcentaje', 'monto_fijo', 'nxm', 'cantidad_minima');
exception when duplicate_object then null; end $$;

do $$ begin
  create type promo_alcance as enum ('todo', 'producto', 'categoria');
exception when duplicate_object then null; end $$;

create table if not exists public.promotions (
  id                   uuid primary key default gen_random_uuid(),
  nombre               text not null,
  descripcion          text,
  tipo                 promo_tipo not null,
  alcance              promo_alcance not null default 'todo',
  product_id           uuid references public.products(id) on delete cascade,
  category_id          uuid references public.categories(id) on delete cascade,
  descuento_porcentaje numeric(5,2),
  descuento_monto      integer,           -- $ por unidad (precios integer en pesos)
  nxm_compra           int,
  nxm_paga             int,
  cantidad_minima      int,
  fecha_inicio         timestamptz,
  fecha_fin            timestamptz,
  activo               boolean not null default true,
  created_at           timestamptz not null default now(),
  -- Coherencia tipo ↔ campos (como SUK)
  constraint promo_pct_chk   check (tipo <> 'porcentaje'      or descuento_porcentaje is not null),
  constraint promo_monto_chk check (tipo <> 'monto_fijo'      or descuento_monto is not null),
  constraint promo_nxm_chk   check (tipo <> 'nxm'             or (nxm_compra is not null and nxm_paga is not null and nxm_paga < nxm_compra)),
  constraint promo_cant_chk  check (tipo <> 'cantidad_minima' or (cantidad_minima is not null and descuento_porcentaje is not null)),
  constraint promo_prod_chk  check (alcance <> 'producto'     or product_id is not null),
  constraint promo_cat_chk   check (alcance <> 'categoria'    or category_id is not null)
);
create index if not exists promotions_activo_idx   on public.promotions(activo);
create index if not exists promotions_product_idx  on public.promotions(product_id);
create index if not exists promotions_category_idx on public.promotions(category_id);

-- Lectura pública (marketing); escritura SOLO service role (sin policies de escritura).
alter table public.promotions enable row level security;
do $$ begin
  create policy "promotions_public_read" on public.promotions for select using (true);
exception when duplicate_object then null; end $$;

-- ── Configuración global de la tienda (single-row, id siempre = 1) ──────────
create table if not exists public.store_settings (
  id                        integer primary key default 1 check (id = 1),
  transfer_discount_pct     numeric(5,2) not null default 10
                            check (transfer_discount_pct >= 0 and transfer_discount_pct <= 90),
  transfer_discount_enabled boolean not null default false,
  updated_at                timestamptz not null default now()
);
insert into public.store_settings (id) values (1) on conflict (id) do nothing;

-- El % se muestra en la tienda (no es secreto) → lectura pública.
-- Escritura: solo service role (las server actions del admin bypasean RLS).
alter table public.store_settings enable row level security;
do $$ begin
  create policy "store_settings_public_read" on public.store_settings for select using (true);
exception when duplicate_object then null; end $$;

-- ── Desglose de descuentos en las órdenes ───────────────────────────────────
-- promo_discount    = ahorro promocional (promo_price + módulo de promociones)
--                     vs el precio de lista. subtotal ya viene con esto aplicado.
-- transfer_discount = descuento por transferencia sobre el subtotal.
--                     total = subtotal - transfer_discount.
alter table public.orders
  add column if not exists promo_discount    integer not null default 0,
  add column if not exists transfer_discount integer not null default 0;
