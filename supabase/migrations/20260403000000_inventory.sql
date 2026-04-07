-- Add SKU and cost_price to products
alter table public.products
  add column if not exists sku text unique,
  add column if not exists cost_price integer not null default 0,
  add column if not exists low_stock_threshold integer not null default 5;

-- Stock movements history
create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade not null,
  type text not null check (type in ('in', 'out', 'adjustment', 'sale', 'return')),
  quantity integer not null,
  previous_stock integer not null,
  new_stock integer not null,
  reason text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.stock_movements enable row level security;

create policy "Admins can manage stock movements"
  on public.stock_movements for all
  using (public.is_admin());

-- Index for faster queries
create index stock_movements_product_id_idx on public.stock_movements(product_id);
create index stock_movements_created_at_idx on public.stock_movements(created_at desc);
