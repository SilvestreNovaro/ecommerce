-- ============================================================================
-- Nalika · Rediseño — Infra admin: roles, permisos y auditoría (SUK 0003)
-- ----------------------------------------------------------------------------
-- admin_users: quién puede entrar al backoffice y con qué permisos.
-- RLS deny-all: se lee/escribe SOLO por service role (lib/admin-auth.ts).
-- audit_logs: registro de mutaciones sensibles del admin.
-- ============================================================================

create type admin_role as enum ('admin', 'operador');

create table public.admin_users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  full_name   text,
  role        admin_role not null default 'operador',
  -- null = permisos por defecto del rol. Array de strings:
  -- "seccion" = lectura+escritura · "seccion:readonly" = solo lectura.
  permissions jsonb,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid,
  admin_email text,
  action      text not null,
  target_type text,
  target_id   text,
  details     jsonb,
  ip_address  text,
  created_at  timestamptz not null default now()
);
create index audit_logs_created_at_idx on public.audit_logs(created_at desc);

-- RLS deny-all (sin policies): solo el service role accede.
alter table public.admin_users enable row level security;
alter table public.audit_logs  enable row level security;

-- Seed: los dos dueños del proyecto como admins.
insert into public.admin_users (id, email, full_name, role)
select id, email, 'Joaco', 'admin'::admin_role
from auth.users where email = 'joaquinnovaroh@gmail.com'
on conflict (id) do nothing;

insert into public.admin_users (id, email, full_name, role)
select id, email, 'Silvestre', 'admin'::admin_role
from auth.users where email = 'silvestrenovarohueyo@gmail.com'
on conflict (id) do nothing;
