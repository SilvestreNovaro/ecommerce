import { createAdminClient } from "@/lib/supabase/admin";
import { requireSection } from "@/lib/admin-auth";
import CatalogAdminList, { type AdminProduct } from "@/components/admin/catalog-admin-list";
import {
  createProduct,
  duplicateProduct,
  reorderProducts,
  updateCatalogPrices,
} from "./actions";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string;
  slug: string;
  price: number;
  promo_price: number | null;
  stock: number;
  active: boolean;
  featured: boolean;
  image_url: string | null;
  category_id: string | null;
};

export default async function AdminCatalogoPage() {
  await requireSection("catalogo");
  const admin = createAdminClient();

  const [{ data, error }, { data: cats }] = await Promise.all([
    admin
      .from("products")
      .select("id, name, slug, price, promo_price, stock, active, featured, image_url, category_id")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    admin.from("categories").select("id, name"),
  ]);

  if (error) return <p className="text-sm text-red-600">Error cargando catálogo: {error.message}</p>;

  const catName = new Map((cats ?? []).map((c) => [c.id, c.name]));
  const items: AdminProduct[] = ((data ?? []) as Row[]).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: Number(p.price) || 0,
    promoPrice: p.promo_price != null ? Number(p.promo_price) : null,
    stock: p.stock,
    active: p.active,
    featured: p.featured,
    image: p.image_url,
    category: p.category_id ? (catName.get(p.category_id) ?? "—") : "—",
  }));

  const activos = items.filter((p) => p.active).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Catálogo</h1>
          <p className="text-sm text-ink/50">
            {items.length} {items.length === 1 ? "producto" : "productos"} · {activos} activos ·{" "}
            {items.length - activos} borradores
          </p>
        </div>
        <form action={createProduct}>
          <button
            type="submit"
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            + Producto
          </button>
        </form>
      </div>

      <CatalogAdminList
        items={items}
        savePrices={updateCatalogPrices}
        reorderAction={reorderProducts}
        duplicateAction={duplicateProduct}
      />
    </div>
  );
}
