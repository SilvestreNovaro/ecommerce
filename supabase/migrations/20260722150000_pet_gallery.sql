-- ============================================================================
-- Nalika · Galería Mascotas (replicado de SUK 0009 "Suk Comunidad", renombrado)
-- ----------------------------------------------------------------------------
-- Fotos de mascotas de clientes, curadas desde el admin, que se muestran en la
-- home y en /galeria. RLS: el público SOLO lee las activas · escritura
-- exclusiva por service role (server actions del admin).
-- ============================================================================

create table if not exists pet_photos (
  id         uuid primary key default gen_random_uuid(),
  image_url  text not null,
  alt        text,
  orden      int not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists pet_photos_orden_idx on pet_photos(orden);

alter table pet_photos enable row level security;
do $$ begin
  create policy "pet_photos_public_read" on pet_photos for select using (active = true);
exception when duplicate_object then null; end $$;
-- Sin policies de insert/update/delete → escritura solo por service role.

-- Bucket Storage público para las fotos (sube el admin vía server action con
-- service role; el público solo lee).
insert into storage.buckets (id, name, public)
values ('pet-gallery', 'pet-gallery', true)
on conflict do nothing;

do $$ begin
  create policy "pet_gallery_bucket_public_read"
    on storage.objects for select
    using (bucket_id = 'pet-gallery');
exception when duplicate_object then null; end $$;
