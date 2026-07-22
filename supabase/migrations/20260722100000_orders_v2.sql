-- ============================================================================
-- Nalika · Rediseño — Módulo 1: Pedidos (modelo replicado de SUK 0002, adaptado)
-- ----------------------------------------------------------------------------
-- Reemplaza el modelo de órdenes original (un solo `status` que mezclaba pago
-- y logística) por el modelo SUK: payment_status y logistic_status SEPARADOS,
-- order_number legible, retiro/envío, snapshot de contacto y montos numeric.
-- Adaptación Nalika: sin design_id ni size_label (todos los productos son
-- terminados, no hay personalización).
-- La DB está vacía (proyecto recién migrado), se puede dropear sin pérdida.
-- ============================================================================

-- ── Limpieza del modelo viejo ───────────────────────────────────────────────
drop table if exists public.order_items cascade;
drop table if exists public.orders cascade;

-- ── Profiles: campos que el checkout necesita ───────────────────────────────
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

-- ── Órdenes ─────────────────────────────────────────────────────────────────
create table public.orders (
  id             uuid primary key default gen_random_uuid(),
  order_number   bigint generated always as identity,
  user_id        uuid not null references public.profiles(id) on delete restrict,

  -- Contacto (snapshot al momento de la compra)
  customer_name  text not null,
  customer_email text not null,
  customer_phone text not null,

  -- Pago
  payment_method text not null check (payment_method in ('transfer', 'mercado_pago')),
  payment_status text not null default 'pending'
                 check (payment_status in ('pending', 'paid', 'rejected')),
  paid_at        timestamptz,

  -- Logística (separada del pago)
  logistic_status text not null default 'received'
                 check (logistic_status in ('received', 'preparing', 'shipped', 'delivered', 'cancelled')),

  -- Entrega: retiro o envío a domicilio
  fulfillment    text not null check (fulfillment in ('pickup', 'delivery')),
  ship_address   text,
  ship_city      text,
  ship_province  text,
  ship_zip       text,
  ship_notes     text,

  -- Montos (siempre calculados server-side)
  subtotal       numeric(12,2) not null,
  shipping_cost  numeric(12,2) not null default 0,  -- 0 = a coordinar por WhatsApp
  total          numeric(12,2) not null,
  currency       text not null default 'ARS',

  -- Mercado Pago (se completan cuando se integre)
  mp_preference_id text,
  mp_payment_id    text,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index orders_user_id_idx on public.orders(user_id);
create index orders_created_at_idx on public.orders(created_at desc);

-- ── Ítems de la orden ───────────────────────────────────────────────────────
-- product_name / unit_price son snapshot (los precios del catálogo pueden cambiar).
create table public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  product_id   uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity     int not null check (quantity > 0),
  unit_price   numeric(12,2) not null,
  subtotal     numeric(12,2) not null
);
create index order_items_order_id_idx on public.order_items(order_id);

-- ── Pending orders (Mercado Pago, listo para cuando se integre) ─────────────
create table public.pending_orders (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  mp_preference_id text unique,
  snapshot         jsonb not null,
  status           text not null default 'pending'
                   check (status in ('pending', 'approved', 'rejected', 'expired')),
  order_id         uuid references public.orders(id) on delete set null,
  created_at       timestamptz not null default now(),
  expires_at       timestamptz not null default (now() + interval '24 hours'),
  processed_at     timestamptz
);

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.pending_orders enable row level security;

-- orders: el cliente ve solo sus órdenes. Las escrituras van por service role.
create policy "own orders select" on public.orders
  for select using (auth.uid() = user_id);

-- order_items: visibles si la orden es del usuario.
create policy "own order_items select" on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid())
  );

-- Admins ven/gestionan todo (el admin de Nalika opera con sesión + is_admin,
-- las mutaciones críticas igual van por service role en server actions).
create policy "admin orders all" on public.orders
  for all using (public.is_admin());
create policy "admin order_items all" on public.order_items
  for all using (public.is_admin());

-- pending_orders: sin policies → solo service role.
