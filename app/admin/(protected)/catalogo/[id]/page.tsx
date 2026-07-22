import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSection } from "@/lib/admin-auth";
import CatalogForm from "@/components/admin/catalog-form";

export const dynamic = "force-dynamic";

export default async function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSection("catalogo");
  const { id } = await params;
  const admin = createAdminClient();

  const [{ data: product }, { data: categories }, { data: images }] = await Promise.all([
    admin
      .from("products")
      .select("id, name, slug, description, price, promo_price, category_id, stock, active, featured")
      .eq("id", id)
      .maybeSingle(),
    admin.from("categories").select("id, name, parent_id").order("name"),
    admin
      .from("product_images")
      .select("id, url")
      .eq("product_id", id)
      .order("orden", { ascending: true }),
  ]);

  if (!product) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/catalogo" className="text-sm text-ink/50 hover:text-brand">
          ← Volver al catálogo
        </Link>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">
          {product.name || "Producto"}
        </h1>
      </div>

      <CatalogForm
        id={product.id}
        categories={(categories ?? []).map((c) => ({
          id: c.id,
          name: c.name,
          parent_id: c.parent_id,
        }))}
        initial={{
          name: product.name,
          slug: product.slug,
          description: product.description ?? "",
          price: Number(product.price) || 0,
          promo_price: product.promo_price != null ? Number(product.promo_price) : null,
          category_id: product.category_id,
          stock: product.stock ?? 0,
          active: product.active,
          featured: product.featured ?? false,
        }}
        images={(images ?? []).map((im) => ({ id: im.id, url: im.url }))}
      />
    </div>
  );
}
