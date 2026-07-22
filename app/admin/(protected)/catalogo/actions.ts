"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireWrite } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";

const MAX_IMG_BYTES = 8 * 1024 * 1024; // 8MB por archivo
const IMG_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export type CatalogData = {
  name: string;
  slug: string;
  description: string;
  price: number;
  promo_price: number | null; // opcional; null = sin oferta
  category_id: string | null;
  stock: number;
  active: boolean;
  featured: boolean;
};

const normPromo = (v: unknown): number | null => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n > 0 ? n : null;
};
const normPrice = (v: unknown): number => Math.max(0, Math.round(Number(v)) || 0);

function revalidateShop(slug?: string) {
  revalidatePath("/admin/catalogo");
  revalidatePath("/");
  revalidatePath("/productos");
  if (slug) revalidatePath(`/productos/${slug}`);
}

// ── Crear producto (nace como borrador y te lleva al editor) ────────────────
export async function createProduct(): Promise<void> {
  const user = await requireWrite("catalogo");
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("products")
    .insert({
      name: "Nuevo producto",
      slug: `producto-${Date.now()}`,
      description: "",
      price: 0,
      stock: 0,
      active: false,
    })
    .select("id")
    .single();
  if (error) throw new Error(`createProduct: ${error.message}`);

  await audit(user, "product_created", { type: "product", id: data.id });
  revalidatePath("/admin/catalogo");
  redirect(`/admin/catalogo/${data.id}`);
}

// ── Actualizar datos desde el editor ────────────────────────────────────────
export async function updateProduct(id: string, data: CatalogData): Promise<void> {
  const user = await requireWrite("catalogo");
  const admin = createAdminClient();
  const { error } = await admin
    .from("products")
    .update({
      name: data.name.trim(),
      slug: data.slug.trim(),
      description: data.description,
      price: normPrice(data.price),
      promo_price: normPromo(data.promo_price),
      category_id: data.category_id || null,
      stock: Math.max(0, Math.round(Number(data.stock)) || 0),
      active: data.active,
      featured: !!data.featured,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(`updateProduct: ${error.message}`);

  await audit(user, "product_updated", { type: "product", id, details: { slug: data.slug } });
  revalidatePath(`/admin/catalogo/${id}`);
  revalidateShop(data.slug.trim());
}

// ── Edición rápida de precios desde la LISTA (sin entrar al producto) ───────
export async function updateCatalogPrices(
  id: string,
  price: number,
  promoPrice: number | null
): Promise<void> {
  const user = await requireWrite("catalogo");
  const admin = createAdminClient();
  const { error } = await admin
    .from("products")
    .update({
      price: normPrice(price),
      promo_price: normPromo(promoPrice),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(`updateCatalogPrices: ${error.message}`);

  await audit(user, "product_prices_updated", {
    type: "product",
    id,
    details: { price: normPrice(price), promo_price: normPromo(promoPrice) },
  });
  revalidateShop();
}

// ── Reordenar (↑/↓ en la lista): sort_order = posición ──────────────────────
export async function reorderProducts(ids: string[]): Promise<void> {
  const user = await requireWrite("catalogo");
  const admin = createAdminClient();
  await Promise.all(
    ids.map((id, i) => admin.from("products").update({ sort_order: i }).eq("id", id))
  );
  await audit(user, "products_reordered", { type: "product", details: { count: ids.length } });
  revalidateShop();
}

// ── Toggle activo / destacado (desde la lista) ──────────────────────────────
export async function toggleActive(formData: FormData): Promise<void> {
  const user = await requireWrite("catalogo");
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("falta id");
  const admin = createAdminClient();
  const { data: p } = await admin.from("products").select("active, slug").eq("id", id).single();
  if (!p) throw new Error("Producto no encontrado");
  const { error } = await admin.from("products").update({ active: !p.active }).eq("id", id);
  if (error) throw new Error(`toggleActive: ${error.message}`);
  await audit(user, "product_toggle_active", { type: "product", id, details: { active: !p.active } });
  revalidatePath(`/admin/catalogo/${id}`);
  revalidateShop(p.slug);
}

export async function toggleFeatured(formData: FormData): Promise<void> {
  const user = await requireWrite("catalogo");
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("falta id");
  const admin = createAdminClient();
  const { data: p } = await admin.from("products").select("featured, slug").eq("id", id).single();
  if (!p) throw new Error("Producto no encontrado");
  const { error } = await admin.from("products").update({ featured: !p.featured }).eq("id", id);
  if (error) throw new Error(`toggleFeatured: ${error.message}`);
  await audit(user, "product_toggle_featured", { type: "product", id, details: { featured: !p.featured } });
  revalidatePath(`/admin/catalogo/${id}`);
  revalidateShop(p.slug);
}

// ── Duplicar (la copia nace como borrador) ──────────────────────────────────
export async function duplicateProduct(formData: FormData): Promise<void> {
  const user = await requireWrite("catalogo");
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("falta id");
  const admin = createAdminClient();

  const { data: orig } = await admin.from("products").select("*").eq("id", id).single();
  if (!orig) throw new Error("Producto no encontrado");

  const { data: copy, error } = await admin
    .from("products")
    .insert({
      name: `${orig.name} (copia)`,
      slug: `${orig.slug}-copia-${Date.now().toString(36).slice(-4)}`,
      description: orig.description,
      price: orig.price,
      promo_price: orig.promo_price,
      category_id: orig.category_id,
      stock: orig.stock,
      image_url: orig.image_url,
      sort_order: orig.sort_order,
      active: false, // la copia nace como borrador
      featured: false,
    })
    .select("id")
    .single();
  if (error) throw new Error(`duplicateProduct: ${error.message}`);

  await audit(user, "product_duplicated", { type: "product", id: copy.id, details: { from: id } });
  revalidatePath("/admin/catalogo");
  redirect(`/admin/catalogo/${copy.id}`);
}

// ── Eliminar ────────────────────────────────────────────────────────────────
// Si el producto tiene ventas asociadas (order_items) NO se borra: se desactiva
// (patrón Nalika, preserva el historial de pedidos). Sin ventas → borrado real
// (galería del bucket incluida).
export async function deleteProduct(formData: FormData): Promise<void> {
  const user = await requireWrite("catalogo");
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("falta id");
  const admin = createAdminClient();

  const { count } = await admin
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("product_id", id);

  if ((count ?? 0) > 0) {
    const { error } = await admin.from("products").update({ active: false }).eq("id", id);
    if (error) throw new Error(`deleteProduct (desactivar): ${error.message}`);
    await audit(user, "product_deactivated_has_sales", { type: "product", id, details: { sales: count } });
  } else {
    // Limpiar la galería del bucket antes de borrar la fila.
    const { data: imgs } = await admin.from("product_images").select("url").eq("product_id", id);
    const paths = (imgs ?? [])
      .map((i) => storagePathFromUrl(i.url))
      .filter((p): p is string => !!p);
    if (paths.length > 0) await admin.storage.from("product-images").remove(paths);

    const { error } = await admin.from("products").delete().eq("id", id);
    if (error) throw new Error(`deleteProduct: ${error.message}`);
    await audit(user, "product_deleted", { type: "product", id });
  }

  revalidateShop();
  redirect("/admin/catalogo");
}

// ── Galería de imágenes (product_images) ────────────────────────────────────
// La primera imagen (orden más bajo) se sincroniza a products.image_url (portada).

function storagePathFromUrl(url: string): string | null {
  const path = (url.split("/product-images/")[1] || "").split("?")[0];
  return path || null;
}

async function syncCover(admin: ReturnType<typeof createAdminClient>, productId: string) {
  const { data } = await admin
    .from("product_images")
    .select("url")
    .eq("product_id", productId)
    .order("orden", { ascending: true })
    .limit(1);
  await admin.from("products").update({ image_url: data?.[0]?.url ?? null }).eq("id", productId);
}

function revalidateProductImg(id: string) {
  revalidatePath(`/admin/catalogo/${id}`);
  revalidatePath("/");
  revalidatePath("/productos");
}

export async function addProductImage(formData: FormData): Promise<{ id: string; url: string }> {
  const user = await requireWrite("catalogo");
  const id = String(formData.get("id") || "");
  const file = formData.get("file");
  if (!id) throw new Error("falta id");
  if (!(file instanceof File)) throw new Error("falta el archivo");
  const ext = IMG_TYPES[file.type];
  if (!ext) throw new Error("formato inválido (solo PNG, JPG o WEBP)");
  if (file.size === 0 || file.size > MAX_IMG_BYTES) throw new Error("tamaño inválido (máx 8MB)");

  const admin = createAdminClient();
  const path = `products/${id}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const { error: upErr } = await admin.storage
    .from("product-images")
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
  if (upErr) throw new Error(`addProductImage storage: ${upErr.message}`);
  const url = admin.storage.from("product-images").getPublicUrl(path).data.publicUrl;

  const { count } = await admin
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", id);
  const { data: row, error } = await admin
    .from("product_images")
    .insert({ product_id: id, url, orden: count ?? 0 })
    .select("id")
    .single();
  if (error) throw new Error(`addProductImage db: ${error.message}`);

  await syncCover(admin, id);
  await audit(user, "product_image_added", { type: "product", id, details: { image_id: row.id } });
  revalidateProductImg(id);
  return { id: row.id, url };
}

export async function deleteProductImage(imageId: string): Promise<void> {
  const user = await requireWrite("catalogo");
  const admin = createAdminClient();
  const { data: img } = await admin
    .from("product_images")
    .select("url, product_id")
    .eq("id", imageId)
    .maybeSingle();
  if (!img) return;

  const path = storagePathFromUrl(img.url);
  if (path) await admin.storage.from("product-images").remove([path]);
  await admin.from("product_images").delete().eq("id", imageId);
  await syncCover(admin, img.product_id);
  await audit(user, "product_image_deleted", { type: "product", id: img.product_id, details: { image_id: imageId } });
  revalidateProductImg(img.product_id);
}

export async function reorderProductImages(productId: string, ids: string[]): Promise<void> {
  const user = await requireWrite("catalogo");
  const admin = createAdminClient();
  await Promise.all(
    ids.map((id, i) => admin.from("product_images").update({ orden: i }).eq("id", id).eq("product_id", productId))
  );
  await syncCover(admin, productId);
  await audit(user, "product_images_reordered", { type: "product", id: productId });
  revalidateProductImg(productId);
}
