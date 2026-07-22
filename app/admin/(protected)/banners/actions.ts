"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireWrite } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { BANNER_SECTIONS, BANNER_SECTION_VALUES } from "@/lib/banner-sections";

const BUCKET = "banners";
const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

function pathFromUrl(url: string | null): string | null {
  if (!url) return null;
  const path = (url.split(`/${BUCKET}/`)[1] || "").split("?")[0];
  return path || null;
}

// Revalida el admin + todas las páginas que muestran banners (para que el
// cambio se vea sin importar a qué sección pertenezca).
function revalidateBanners() {
  revalidatePath("/admin/banners");
  for (const s of BANNER_SECTIONS) revalidatePath(s.path);
}

export async function uploadBannerImage(formData: FormData): Promise<{ url: string }> {
  await requireWrite("banners");
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Falta el archivo");
  const ext = MIME[file.type];
  if (!ext) throw new Error("Formato no permitido (PNG, JPG o WebP)");
  if (file.size === 0 || file.size > MAX_BYTES) throw new Error("La imagen supera 8MB");

  const db = createAdminClient();
  const buf = Buffer.from(await file.arrayBuffer());
  const path = `banner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await db.storage
    .from(BUCKET)
    .upload(path, buf, { contentType: file.type, cacheControl: "3600", upsert: false });
  if (error) throw new Error(error.message);
  return { url: db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl };
}

export type BannerInput = {
  id?: string;
  section: string;
  eyebrow: string | null;
  titulo: string | null;
  subtitulo: string | null;
  cta_label: string | null;
  cta_href: string | null;
  image_desktop_url: string | null;
  image_mobile_url: string | null;
  bg: string | null;
  text_light: boolean;
  orden: number;
  activo: boolean;
};

export async function saveBanner(input: BannerInput): Promise<void> {
  const user = await requireWrite("banners");
  const db = createAdminClient();

  const section = BANNER_SECTION_VALUES.includes(input.section) ? input.section : "home";

  // El banner se sirve a TODO el público → validar para no inyectar
  // javascript:/CSS malicioso (replicado de SUK).
  const ctaHref = input.cta_href?.trim() || null;
  if (ctaHref && !/^(\/|https?:\/\/)/i.test(ctaHref)) {
    throw new Error("El link del botón debe ser una ruta interna (/...) o https://");
  }
  const bgRaw = input.bg?.trim() || null;
  if (bgRaw && /(javascript:|expression\(|<|@import)/i.test(bgRaw)) {
    throw new Error("Fondo CSS inválido");
  }

  const payload = {
    section,
    eyebrow: input.eyebrow?.trim() || null,
    titulo: input.titulo?.trim() || null,
    subtitulo: input.subtitulo?.trim() || null,
    cta_label: input.cta_label?.trim() || null,
    cta_href: ctaHref,
    image_desktop_url: input.image_desktop_url || null,
    image_mobile_url: input.image_mobile_url || null,
    bg: bgRaw,
    text_light: !!input.text_light,
    orden: Math.round(Number(input.orden) || 0),
    activo: !!input.activo,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    // Al reemplazar/quitar una imagen, borrar la anterior del bucket.
    const { data: prev } = await db
      .from("banners")
      .select("image_desktop_url, image_mobile_url")
      .eq("id", input.id)
      .maybeSingle();
    const toRemove: string[] = [];
    if (prev?.image_desktop_url && prev.image_desktop_url !== payload.image_desktop_url) {
      const p = pathFromUrl(prev.image_desktop_url);
      if (p) toRemove.push(p);
    }
    if (prev?.image_mobile_url && prev.image_mobile_url !== payload.image_mobile_url) {
      const p = pathFromUrl(prev.image_mobile_url);
      if (p) toRemove.push(p);
    }
    if (toRemove.length) await db.storage.from(BUCKET).remove(toRemove);

    const { error } = await db.from("banners").update(payload).eq("id", input.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await db.from("banners").insert(payload);
    if (error) throw new Error(error.message);
  }

  await audit(user, input.id ? "banner_updated" : "banner_created", {
    type: "banner",
    id: input.id,
    details: { section },
  });
  revalidateBanners();
}

// Recibe FormData con "id" (compatible con ConfirmDeleteButton). Borra también
// las imágenes del bucket.
export async function deleteBanner(formData: FormData): Promise<void> {
  const user = await requireWrite("banners");
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("falta id");
  const db = createAdminClient();

  const { data: b } = await db
    .from("banners")
    .select("image_desktop_url, image_mobile_url")
    .eq("id", id)
    .maybeSingle();
  const toRemove = [
    pathFromUrl(b?.image_desktop_url ?? null),
    pathFromUrl(b?.image_mobile_url ?? null),
  ].filter((p): p is string => !!p);
  if (toRemove.length) await db.storage.from(BUCKET).remove(toRemove);

  const { error } = await db.from("banners").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await audit(user, "banner_deleted", { type: "banner", id });
  revalidateBanners();
}

export async function toggleBanner(id: string, activo: boolean): Promise<void> {
  const user = await requireWrite("banners");
  const db = createAdminClient();
  const { error } = await db
    .from("banners")
    .update({ activo, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  await audit(user, "banner_toggled", { type: "banner", id, details: { activo } });
  revalidateBanners();
}

export async function setBannerOrden(id: string, orden: number): Promise<void> {
  await requireWrite("banners");
  const db = createAdminClient();
  const { error } = await db
    .from("banners")
    .update({ orden: Math.round(orden), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateBanners();
}
