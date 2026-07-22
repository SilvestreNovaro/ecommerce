import { createAdminClient } from "@/lib/supabase/admin";
import { requireSection } from "@/lib/admin-auth";
import { getStoreSettings } from "@/lib/settings";
import { saveTransferDiscount } from "./actions-transfer";
import PromotionsAdmin, { type PromotionRow } from "@/components/admin/promotions-admin";

export const dynamic = "force-dynamic";

export default async function AdminPromocionesPage() {
  await requireSection("promociones");
  const admin = createAdminClient();
  const [{ data: promotions }, { data: products }, { data: categories }, transfer] =
    await Promise.all([
      admin
        .from("promotions")
        .select("*, product:products(id, name), category:categories(id, name)")
        .order("created_at", { ascending: false }),
      admin.from("products").select("id, name").eq("active", true).order("name"),
      admin.from("categories").select("id, name, parent_id").order("name"),
      getStoreSettings(),
    ]);

  return (
    <div className="flex flex-col gap-6">
      {/* Descuento por transferencia (global, FIJO — no se puede eliminar) */}
      <section className="rounded-2xl border border-brand/20 bg-brand/[0.03] p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display font-bold text-ink">Descuento por transferencia</h2>
          <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink/40">
            Fijo · no se elimina
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              transfer.transferEnabled ? "bg-save/15 text-save" : "bg-black/10 text-ink/50"
            }`}
          >
            {transfer.transferEnabled ? "Activo" : "Inactivo"}
          </span>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-ink/50">
          Se aplica a <strong>todos los productos</strong> sobre el precio vigente (el promocional
          si hay oferta, o el normal). Es el &ldquo;precio con transferencia&rdquo; que ve el
          cliente en toda la tienda. Si lo desactivás, deja de mostrarse.
        </p>
        <form action={saveTransferDiscount} className="mt-3 flex flex-wrap items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              name="enabled"
              defaultChecked={transfer.transferEnabled}
              className="h-4 w-4 accent-brand"
            />
            Activo
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="pct"
              min={0}
              max={90}
              step="0.5"
              defaultValue={transfer.transferPct}
              className="w-24 rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
            <span className="text-sm text-ink/60">% de descuento</span>
          </div>
          <button
            type="submit"
            className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Guardar
          </button>
        </form>
      </section>

      <PromotionsAdmin
        promotions={(promotions ?? []) as PromotionRow[]}
        products={products ?? []}
        categories={categories ?? []}
      />
    </div>
  );
}
