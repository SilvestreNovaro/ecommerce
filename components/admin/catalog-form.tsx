"use client";

import { useState, useTransition } from "react";
import {
  updateProduct,
  duplicateProduct,
  deleteProduct,
  type CatalogData,
} from "@/app/admin/(protected)/catalogo/actions";
import ProductImagesManager, { type ProductImage } from "@/components/admin/product-images-manager";
import ConfirmDeleteButton from "@/components/admin/confirm-delete-button";

export type CategoryOption = { id: string; name: string; parent_id: string | null };

// "Alimento Premium Perro Adulto 15kg" → "alimento-premium-perro-adulto-15kg"
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CatalogForm({
  id,
  initial,
  categories,
  images,
}: {
  id: string;
  initial: CatalogData;
  categories: CategoryOption[];
  images: ProductImage[];
}) {
  const [form, setForm] = useState<CatalogData>(initial);
  // El slug se auto-genera desde el nombre hasta que lo toques a mano.
  const [slugTouched, setSlugTouched] = useState(initial.slug !== slugify(initial.name));
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [saving, startSaving] = useTransition();

  function set<K extends keyof CatalogData>(key: K, value: CatalogData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onNameChange(name: string) {
    setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
  }

  function handleSave() {
    setMsg(null);
    if (!form.name.trim()) { setMsg({ kind: "err", text: "El nombre no puede estar vacío." }); return; }
    if (!form.slug.trim()) { setMsg({ kind: "err", text: "El slug no puede estar vacío." }); return; }
    if (form.promo_price != null && form.promo_price >= form.price) {
      setMsg({ kind: "err", text: "El precio promocional debe ser menor al normal." });
      return;
    }
    startSaving(async () => {
      try {
        await updateProduct(id, { ...form, slug: slugify(form.slug) });
        setMsg({ kind: "ok", text: "Guardado ✓" });
      } catch (e) {
        setMsg({ kind: "err", text: e instanceof Error ? e.message : "Error al guardar" });
      }
    });
  }

  const parents = categories.filter((c) => !c.parent_id);
  const childrenOf = (pid: string) => categories.filter((c) => c.parent_id === pid);

  const inputCls =
    "rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand";
  const labelCls = "flex flex-col gap-1.5 text-sm font-medium text-ink";

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-black/5 bg-white p-5">
        <h2 className="mb-4 font-display font-bold text-ink">Datos</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelCls}>
            Nombre
            <input
              className={inputCls}
              value={form.name}
              placeholder="Ej.: Alimento Premium Perro Adulto 15kg"
              onChange={(e) => onNameChange(e.target.value)}
            />
          </label>
          <label className={labelCls}>
            Slug (URL)
            <input
              className={inputCls}
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value);
              }}
            />
          </label>
          <label className={`${labelCls} sm:col-span-2`}>
            Descripción
            <textarea
              className={inputCls}
              rows={3}
              value={form.description}
              placeholder="Ej.: Alimento balanceado para perros adultos de razas medianas y grandes."
              onChange={(e) => set("description", e.target.value)}
            />
          </label>
          <label className={labelCls}>
            Precio normal (ARS)
            <input
              type="number"
              min={0}
              step={1}
              className={inputCls}
              value={form.price}
              onChange={(e) => set("price", Number(e.target.value))}
            />
          </label>
          <label className={labelCls}>
            Precio promocional (ARS){" "}
            <span className="font-normal text-ink/40">
              — opcional; si está y es menor al normal, se muestra como oferta
            </span>
            <input
              type="number"
              min={0}
              step={1}
              className={inputCls}
              value={form.promo_price ?? ""}
              placeholder="sin oferta"
              onChange={(e) => set("promo_price", e.target.value === "" ? null : Number(e.target.value))}
            />
          </label>
          <label className={labelCls}>
            Categoría
            <select
              className={inputCls}
              value={form.category_id ?? ""}
              onChange={(e) => set("category_id", e.target.value || null)}
            >
              <option value="">Sin categoría</option>
              {parents.map((p) => {
                const kids = childrenOf(p.id);
                return kids.length > 0 ? (
                  <optgroup key={p.id} label={p.name}>
                    <option value={p.id}>{p.name}</option>
                    {kids.map((k) => (
                      <option key={k.id} value={k.id}>
                        {p.name} › {k.name}
                      </option>
                    ))}
                  </optgroup>
                ) : (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                );
              })}
            </select>
          </label>
          <label className={labelCls}>
            Stock
            <input
              type="number"
              min={0}
              step={1}
              className={inputCls}
              value={form.stock}
              onChange={(e) => set("stock", Number(e.target.value))}
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => set("active", e.target.checked)}
              className="h-4 w-4 accent-brand"
            />
            Activo (visible en la tienda)
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => set("featured", e.target.checked)}
              className="h-4 w-4 accent-brand"
            />
            ⭐ Destacado (aparece en la home)
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-black/5 bg-white p-5">
        <h2 className="mb-1 font-display font-bold text-ink">Imágenes</h2>
        <p className="mb-4 text-xs text-ink/50">
          Subí una o varias (arrastrando o eligiendo). PNG, JPG o WEBP, máx 8MB c/u. Se guardan al instante.
        </p>
        <ProductImagesManager productId={id} initial={images} />
      </section>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <form action={duplicateProduct}>
            <input type="hidden" name="id" value={id} />
            <button
              type="submit"
              className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-ink/70 hover:border-brand hover:text-brand"
            >
              Duplicar
            </button>
          </form>
          <ConfirmDeleteButton
            action={deleteProduct}
            id={id}
            label="Eliminar producto"
            message="Si tiene ventas asociadas se desactiva (no se pierde el historial); si no, se borra con sus imágenes."
          />
        </div>
        <div className="flex items-center gap-3">
          {msg && (
            <span className={`text-sm ${msg.kind === "ok" ? "text-save" : "text-red-600"}`}>{msg.text}</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
