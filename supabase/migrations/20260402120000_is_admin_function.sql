-- Función helper para políticas RLS de admin.
-- Existía en el proyecto original pero se creó a mano (SQL Editor) y no
-- estaba versionada; la migración 20260403000000_inventory.sql depende de ella.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;
