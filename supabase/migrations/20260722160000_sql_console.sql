-- ============================================================================
-- Nalika · Módulo 8 — Consola de Consultas SQL (SUK 0006 + 0007 FUSIONADAS)
-- ----------------------------------------------------------------------------
-- Tabla saved_queries (consultas guardadas del admin, RLS deny-all) + RPC
-- execute_readonly_query que NACE con el hardening del pentest de SUK:
--   · El pentest de SUK (2026-06-18) encontró que la RPC quedaba con EXECUTE
--     para PUBLIC (default de Postgres). Al ser SECURITY DEFINER, cualquiera
--     con la anon key podía ejecutar SELECT arbitrario y leer auth.users
--     (hashes, tokens), admin_users, etc. → DATA BREACH.
--   · Acá se crea DIRECTAMENTE la versión segura: REVOKE a public/anon/
--     authenticated y GRANT solo a service_role (la llama únicamente el
--     endpoint /api/admin/queries/execute, que exige admin).
--   · search_path fijo (hygiene SECURITY DEFINER) + statement_timeout 5s +
--     solo SELECT/WITH + blacklist + LIMIT 5000 forzado.
-- ============================================================================

create table if not exists public.saved_queries (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  descripcion text,
  sql_query   text not null,
  orden       int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- RLS deny-all (sin policies): solo se accede por service role desde el admin.
alter table public.saved_queries enable row level security;

-- Función de solo lectura. SECURITY DEFINER para poder leer todo; los guards
-- son el chequeo SELECT-only + blacklist + timeout + el GRANT solo a service_role.
create or replace function public.execute_readonly_query(query_text text)
returns jsonb
language plpgsql
security definer
set statement_timeout = '5s'
set search_path = pg_catalog, public
as $$
declare
  result jsonb;
  normalized text;
begin
  normalized := upper(trim(query_text));

  if not (normalized like 'SELECT%' or normalized like 'WITH%') then
    raise exception 'Solo se permiten consultas SELECT';
  end if;

  if normalized ~ '(DROP|DELETE|TRUNCATE|ALTER|CREATE|INSERT|UPDATE|GRANT|REVOKE)\s' then
    raise exception 'Operación no permitida en consultas de solo lectura';
  end if;

  execute 'select coalesce(jsonb_agg(row_to_json(t)), ''[]''::jsonb) from (' || query_text || ' limit 5000) t'
    into result;

  return result;
end;
$$;

-- 🔒 LO CRÍTICO (fix del pentest de SUK, acá desde el día cero):
-- solo el server (service_role) puede ejecutarla.
revoke all on function public.execute_readonly_query(text) from public;
revoke all on function public.execute_readonly_query(text) from anon;
revoke all on function public.execute_readonly_query(text) from authenticated;
grant execute on function public.execute_readonly_query(text) to service_role;
