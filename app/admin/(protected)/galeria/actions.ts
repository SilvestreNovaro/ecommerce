"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireWrite } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";

const BUCKET = "pet-gallery";
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

function revalidateGallery() {
  revalidatePath("/admin/galeria");
  revalidatePath("/galeria");
  revalidatePath("/");
}

// Multi-upload: recibe FormData con N archivos bajo "files". Cada foto nace
// activa, al final del orden actual.
export async function uploadPetPhotos(formData: FormData): Promise<void> {
  const user = await requireWrite("galeria");
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) throw new Error("Falta el archivo");

  for (const file of files) {
    if (!MIME[file.type]) throw new Error(`"${file.name}": formato no permitido (PNG, JPG o WebP)`);
    if (file.size === 0 || file.size > MAX_BYTES) throw new Error(`"${file.name}" supera 8MB`);
  }

  const db = createAdminClient();
  const { count } = await db.from("pet_photos").select("id", { count: "exact", head: true });
  let orden = count ?? 0;

  for (const file of files) {
    const buf = Buffer.from(await file.arrayBuffer());
    const path = `pet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${MIME[file.type]}`;
    const { error: upErr } = await db.storage
      .from(BUCKET)
      .upload(path, buf, { contentType: file.type, cacheControl: "3600", upsert: false });
    if (upErr) throw new Error(upErr.message);
    const url = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

    const { error } = await db
      .from("pet_photos")
      .insert({ image_url: url, alt: null, orden: orden++, active: true });
    if (error) throw new Error(error.message);
  }

  await audit(user, "pet_photo_uploaded", {
    type: "pet_photo",
    details: { count: files.length },
  });
  revalidateGallery();
}

export async function updatePetPhoto(
  id: string,
  data: { alt?: string; active?: boolean }
): Promise<void> {
  const user = await requireWrite("galeria");
  const db = createAdminClient();
  const payload: Record<string, unknown> = {};
  if (data.alt !== undefined) payload.alt = data.alt.trim().slice(0, 200) || null;
  if (data.active !== undefined) payload.active = !!data.active;
  const { error } = await db.from("pet_photos").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
  await audit(user, "pet_photo_updated", { type: "pet_photo", id, details: data });
  revalidateGallery();
}

export async function setPetPhotoOrden(id: string, orden: number): Promise<void> {
  await requireWrite("galeria");
  const db = createAdminClient();
  const { error } = await db
    .from("pet_photos")
    .update({ orden: Math.round(orden) })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateGallery();
}

// Recibe FormData con "id" (compatible con ConfirmDeleteButton). Borra también
// el archivo del bucket.
export async function deletePetPhoto(formData: FormData): Promise<void> {
  const user = await requireWrite("galeria");
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("falta id");
  const db = createAdminClient();

  const { data: p } = await db.from("pet_photos").select("image_url").eq("id", id).maybeSingle();
  const path = pathFromUrl(p?.image_url ?? null);
  if (path) await db.storage.from(BUCKET).remove([path]);

  const { error } = await db.from("pet_photos").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await audit(user, "pet_photo_deleted", { type: "pet_photo", id });
  revalidateGallery();
}
