"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";

const money = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(n) || 0);

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  promoPrice: number | null;
  stock: number;
  active: boolean;
  featured: boolean;
  image: string | null;
  category: string;
};

export default function CatalogAdminList({
  items,
  savePrices,
  reorderAction,
  duplicateAction,
}: {
  items: AdminProduct[];
  savePrices: (id: string, price: number, promoPrice: number | null) => Promise<void>;
  reorderAction: (ids: string[]) => Promise<void>;
  duplicateAction: (formData: FormData) => Promise<void>;
}) {
  const [q, setQ] = useState("");
  const [list, setList] = useState(items);

  // Edición de precios inline.
  const [editId, setEditId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editPromo, setEditPromo] = useState("");
  const [err, setErr] = useState("");
  const [saving, startSaving] = useTransition();
  const [, startReorder] = useTransition();

  useEffect(() => setList(items), [items]);

  const searching = q.trim().length > 0;
  const canReorder = !searching && !editId;

  const filtered = useMemo(() => {
    if (!searching) return list;
    const words = q.trim().toLowerCase().split(/\s+/);
    return list.filter((p) => {
      const hay = `${p.id} ${p.name} ${p.slug}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [q, searching, list]);

  function move(index: number, dir: -1 | 1) {
    const to = index + dir;
    if (to < 0 || to >= list.length) return;
    const next = [...list];
    const [m] = next.splice(index, 1);
    next.splice(to, 0, m);
    setList(next);
    startReorder(async () => {
      await reorderAction(next.map((p) => p.id));
    });
  }

  function startEdit(p: AdminProduct) {
    setErr("");
    setEditId(p.id);
    setEditPrice(String(p.price || ""));
    setEditPromo(p.promoPrice != null ? String(p.promoPrice) : "");
  }

  function saveEdit(id: string) {
    setErr("");
    const price = Number(editPrice);
    const promo = editPromo.trim() === "" ? null : Number(editPromo);
    if (!Number.isFinite(price) || price < 0) { setErr("Precio normal inválido."); return; }
    if (promo != null && (!Number.isFinite(promo) || promo <= 0)) { setErr("Precio promocional inválido."); return; }
    if (promo != null && promo >= price) { setErr("La promo debe ser menor al precio normal."); return; }
    startSaving(async () => {
      try {
        await savePrices(id, price, promo);
        setList((l) => l.map((p) => (p.id === id ? { ...p, price, promoPrice: promo } : p)));
        setEditId(null);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Error al guardar.");
      }
    });
  }

  const inputCls = "w-28 rounded-md border border-black/15 px-2 py-1 text-sm outline-none focus:border-brand";

  return (
    <div>
      <div className="relative mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por ID, nombre o slug…"
          className="w-full rounded-full border border-black/10 bg-white px-4 py-2.5 pl-10 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30">🔍</span>
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink/40 hover:text-ink"
            aria-label="Limpiar"
          >
            ✕
          </button>
        )}
      </div>

      <p className="mb-3 text-xs text-ink/40">
        {editId
          ? "Terminá de editar el precio para volver a ordenar."
          : searching
            ? "Borrá la búsqueda para reordenar."
            : "Usá ↑/↓ para ordenar. Tocá ✎ para editar precios sin entrar al producto."}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-black/5 bg-white p-10 text-center text-sm text-ink/50">
          {searching
            ? `Sin resultados para “${q}”.`
            : "Todavía no hay productos. Creá el primero con “+ Producto”."}
        </div>
      ) : (
        <ul className="grid gap-3">
          {filtered.map((p, i) => {
            const isEditing = editId === p.id;
            const hasPromo = p.promoPrice != null && p.promoPrice < p.price;
            return (
              <li key={p.id} className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4">
                {canReorder && (
                  <span className="flex shrink-0 flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className="rounded border border-black/10 px-1.5 text-xs leading-5 text-ink/50 hover:border-brand hover:text-brand disabled:opacity-30"
                      aria-label="Subir"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === list.length - 1}
                      className="rounded border border-black/10 px-1.5 text-xs leading-5 text-ink/50 hover:border-brand hover:text-brand disabled:opacity-30"
                      aria-label="Bajar"
                    >
                      ↓
                    </button>
                  </span>
                )}

                <Link href={`/admin/catalogo/${p.id}`} className="flex min-w-0 flex-1 items-center gap-4 overflow-hidden">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt={p.name} className="h-16 w-16 shrink-0 rounded-lg border border-black/5 object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-black/10 text-lg">
                      🐾
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">
                      {p.featured && <span title="Destacado">⭐ </span>}
                      {p.name}
                    </p>
                    <p className="truncate text-xs text-ink/40">
                      /{p.slug} · {p.category} · Stock: {p.stock}
                    </p>
                    <p className="truncate font-mono text-[10px] text-ink/30">{p.id}</p>
                  </div>
                </Link>

                {/* Precios */}
                {isEditing ? (
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <label className="flex items-center gap-1.5 text-[11px] text-ink/50">
                      Normal
                      <input type="number" min={0} step={1} value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className={inputCls} autoFocus />
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] text-ink/50">
                      Promo
                      <input type="number" min={0} step={1} value={editPromo} placeholder="—" onChange={(e) => setEditPromo(e.target.value)} className={inputCls} />
                    </label>
                    {err && <span className="max-w-[200px] text-right text-[11px] text-red-600">{err}</span>}
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => setEditId(null)} disabled={saving} className="rounded-md px-2 py-1 text-xs text-ink/50 hover:text-ink">
                        Cancelar
                      </button>
                      <button type="button" onClick={() => saveEdit(p.id)} disabled={saving} className="rounded-md bg-brand px-3 py-1 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-50">
                        {saving ? "…" : "Guardar"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="text-right text-sm leading-tight">
                      <p className={hasPromo ? "text-ink/40 line-through" : "font-semibold text-ink"}>{money(p.price)}</p>
                      {hasPromo && (
                        <p className="font-semibold text-save">
                          {money(p.promoPrice!)} <span className="text-[10px] font-normal text-save/70">promo</span>
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => startEdit(p)}
                      title="Editar precios"
                      className="rounded-lg border border-black/10 px-2 py-1.5 text-sm text-ink/50 transition-colors hover:border-brand hover:text-brand"
                      aria-label="Editar precios"
                    >
                      ✎
                    </button>
                  </div>
                )}

                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${p.active ? "bg-save/10 text-save" : "bg-black/5 text-ink/40"}`}
                >
                  {p.active ? "Activo" : "Borrador"}
                </span>

                <form action={duplicateAction} className="shrink-0">
                  <input type="hidden" name="id" value={p.id} />
                  <button
                    type="submit"
                    title="Duplicar como borrador"
                    className="rounded-lg border border-black/10 px-2 py-1.5 text-sm text-ink/50 transition-colors hover:border-brand hover:text-brand"
                    aria-label="Duplicar"
                  >
                    ⧉
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
