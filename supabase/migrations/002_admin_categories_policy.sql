-- Allow admins to manage categories
create policy "Admins can manage categories"
  on public.categories for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Allow admins to view all profiles (for order management)
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles AS p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Allow admins to view all order items
create policy "Admins can view all order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
