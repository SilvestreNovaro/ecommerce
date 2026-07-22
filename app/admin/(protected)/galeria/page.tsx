import { createAdminClient } from "@/lib/supabase/admin";
import { requireSection } from "@/lib/admin-auth";
import PetGalleryAdmin, { type PetPhotoRow } from "@/components/admin/pet-gallery-admin";

export const dynamic = "force-dynamic";

export default async function AdminGaleriaPage() {
  await requireSection("galeria");
  const admin = createAdminClient();
  const { data } = await admin
    .from("pet_photos")
    .select("id, image_url, alt, orden, active")
    .order("orden", { ascending: true });
  return <PetGalleryAdmin photos={(data ?? []) as PetPhotoRow[]} />;
}
