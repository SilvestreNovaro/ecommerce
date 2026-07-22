import "server-only";
import { createClient } from "@/lib/supabase/server";

export type PetPhoto = { id: string; src: string; alt: string };

// Fotos activas de la Galería Mascotas (lectura pública: la RLS solo expone
// active=true). limit opcional (la home muestra hasta 6).
export async function getPetPhotos(limit?: number): Promise<PetPhoto[]> {
  const supabase = await createClient();
  let q = supabase
    .from("pet_photos")
    .select("id, image_url, alt")
    .eq("active", true)
    .order("orden", { ascending: true });
  if (limit) q = q.limit(limit);
  const { data } = await q;
  return (data ?? []).map((p) => ({
    id: p.id,
    src: p.image_url,
    alt: p.alt || "Mascota de la familia Nalika",
  }));
}
