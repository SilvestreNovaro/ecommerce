-- ============================================================================
-- Nalika · Catálogo v2 (Módulo 2 del rediseño, patrón SUK)
-- ----------------------------------------------------------------------------
-- products: featured (destacados a dedo), sort_order (orden manual de la lista)
-- y promo_price (precio promocional opcional; price queda como precio normal).
-- product_images: galería de imágenes por producto. La primera (orden más bajo)
-- se sincroniza a products.image_url (portada que usan las cards de la tienda).
-- ============================================================================

alter table public.products
  add column if not exists featured   boolean not null default false,
  add column if not exists sort_order integer not null default 0,
  add column if not exists promo_price integer
    check (promo_price is null or promo_price > 0);

create index if not exists products_sort_order_idx on public.products(sort_order);

-- ── Galería de imágenes ─────────────────────────────────────────────────────
create table if not exists public.product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url        text not null,
  orden      integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_idx
  on public.product_images(product_id, orden);

-- RLS: lectura pública; SIN policies de escritura (solo service role escribe).
alter table public.product_images enable row level security;

do $$ begin
  create policy "product_images_public_read" on public.product_images
    for select using (true);
exception when duplicate_object then null; end $$;
