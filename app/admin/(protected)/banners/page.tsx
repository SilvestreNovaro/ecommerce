import { createAdminClient } from "@/lib/supabase/admin";
import { requireSection } from "@/lib/admin-auth";
import BannersAdmin, { type BannerRow } from "@/components/admin/banners-admin";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  await requireSection("banners");
  const admin = createAdminClient();
  const { data: banners } = await admin
    .from("banners")
    .select("*")
    .order("section", { ascending: true })
    .order("orden", { ascending: true });
  return <BannersAdmin banners={(banners ?? []) as BannerRow[]} />;
}
