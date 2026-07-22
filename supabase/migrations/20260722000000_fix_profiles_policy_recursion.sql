-- La política "Admins can view all profiles" hacía EXISTS sobre profiles
-- dentro de una política de profiles → recursión infinita (42P17) en cada
-- SELECT autenticado. Se reemplaza por is_admin(), que al ser security
-- definer evalúa sin RLS y corta la recursión.
drop policy if exists "Admins can view all profiles" on public.profiles;

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());
