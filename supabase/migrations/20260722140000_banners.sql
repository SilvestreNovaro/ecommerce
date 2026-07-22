-- ============================================================================
-- Nalika · Banners por sección del sitio (replicado de SUK 0005 + 0008, ya
-- fusionado: nace con `section` en lugar de categorías libres).
-- ----------------------------------------------------------------------------
-- El hero del home es full-viewport con texto + CTA (y opcionalmente imagen
-- desktop/mobile); en páginas internas el banner es una franja superior. Por
-- eso guarda imagen Y contenido (eyebrow/título/subtítulo/CTA) + un fondo CSS
-- (gradiente) de fallback si no hay imagen.
-- RLS: lectura pública (la tienda los consume) · escritura SOLO service role.
-- ============================================================================

create table if not exists banners (
  id                uuid primary key default gen_random_uuid(),
  section           text not null default 'home', -- home | productos | galeria (ver lib/banner-sections.ts)
  eyebrow           text,
  titulo            text,
  subtitulo         text,
  cta_label         text,
  cta_href          text,
  image_desktop_url text,
  image_mobile_url  text,
  bg                text, -- CSS background (ej: linear-gradient(...)) de fallback si no hay imagen
  text_light        boolean not null default true, -- texto claro sobre fondo oscuro
  orden             int not null default 0,
  activo            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists banners_section_idx on banners(section);
create index if not exists banners_orden_idx on banners(orden);

alter table banners enable row level security;
do $$ begin
  create policy "banners_public_read" on banners for select using (true);
exception when duplicate_object then null; end $$;
-- Sin policies de insert/update/delete → escritura solo por service role.

-- Bucket Storage público para las imágenes de banner (sube el admin vía
-- server action con service role; el público solo lee).
insert into storage.buckets (id, name, public)
values ('banners', 'banners', true)
on conflict do nothing;

do $$ begin
  create policy "banners_bucket_public_read"
    on storage.objects for select
    using (bucket_id = 'banners');
exception when duplicate_object then null; end $$;
