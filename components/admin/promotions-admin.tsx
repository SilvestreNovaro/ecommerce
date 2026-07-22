"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  savePromotion,
  deletePromotion,
  togglePromotion,
  type PromoInput,
} from "@/app/admin/(protected)/promociones/actions";

type PromoTipo = "porcentaje" | "monto_fijo" | "nxm" | "cantidad_minima";
type PromoAlcance = "todo" | "producto" | "categoria";

export type PromotionRow = {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: PromoTipo;
  alcance: PromoAlcance;
  product_id: string | null;
  category_id: string | null;
  descuento_porcentaje: number | null;
  descuento_monto: number | null;
  nxm_compra: number | null;
  nxm_paga: number | null;
  cantidad_minima: number | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  activo: boolean;
  product?: { id: string; name: string } | null;
  category?: { id: string; name: string } | null;
};

type CategoryOpt = { id: string; name: string; parent_id: string | null };

const TIPO_LABELS: Record<PromoTipo, string> = {
  porcentaje: "% Descuento",
  monto_fijo: "Monto fijo",
  nxm: "NxM (ej: 2x1)",
  cantidad_minima: "Por cantidad mínima",
};
const TIPO_COLORS: Record<PromoTipo, string> = {
  porcentaje: "bg-save/10 text-save",
  monto_fijo: "bg-blue-100 text-blue-700",
  nxm: "bg-purple-100 text-purple-700",
  cantidad_minima: "bg-amber-100 text-amber-700",
};

const EMPTY_FORM = {
  nombre: "",
  descripcion: "",
  tipo: "porcentaje" as PromoTipo,
  alcance: "todo" as PromoAlcance,
  product_id: "",
  category_id: "",
  descuento_porcentaje: "",
  descuento_monto: "",
  nxm_compra: "2",
  nxm_paga: "1",
  cantidad_minima: "3",
  fecha_inicio: "",
  fecha_fin: "",
  activo: true,
};

const inputCls =
  "w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand";

export default function PromotionsAdmin({
  promotions,
  products,
  categories,
}: {
  promotions: PromotionRow[];
  products: { id: string; name: string }[];
  categories: CategoryOpt[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PromotionRow | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null); // confirmación en dos pasos
  const [error, setError] = useState("");
  const router = useRouter();

  // Categorías ordenadas: padres primero, sus hijas debajo con sangría.
  const parents = categories.filter((c) => !c.parent_id);
  const catOptions = parents.flatMap((p) => [
    { id: p.id, label: p.name },
    ...categories.filter((c) => c.parent_id === p.id).map((c) => ({ id: c.id, label: `— ${c.name}` })),
  ]);

  function openNew() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setError("");
    setModalOpen(true);
  }
  function openEdit(p: PromotionRow) {
    setEditing(p);
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion || "",
      tipo: p.tipo,
      alcance: p.alcance,
      product_id: p.product_id || "",
      category_id: p.category_id || "",
      descuento_porcentaje: p.descuento_porcentaje?.toString() || "",
      descuento_monto: p.descuento_monto?.toString() || "",
      nxm_compra: p.nxm_compra?.toString() || "2",
      nxm_paga: p.nxm_paga?.toString() || "1",
      cantidad_minima: p.cantidad_minima?.toString() || "3",
      fecha_inicio: p.fecha_inicio ? p.fecha_inicio.slice(0, 10) : "",
      fecha_fin: p.fecha_fin ? p.fecha_fin.slice(0, 10) : "",
      activo: p.activo,
    });
    setError("");
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.nombre.trim()) return setError("El nombre es obligatorio");
    if (form.tipo === "porcentaje" || form.tipo === "cantidad_minima") {
      const pct = parseFloat(form.descuento_porcentaje);
      if (!pct || pct <= 0 || pct > 100) return setError("Porcentaje inválido (1-100)");
    }
    if (
      form.tipo === "monto_fijo" &&
      (!parseFloat(form.descuento_monto) || parseFloat(form.descuento_monto) <= 0)
    )
      return setError("Monto inválido");
    if (form.tipo === "nxm") {
      const c = parseInt(form.nxm_compra),
        pg = parseInt(form.nxm_paga);
      if (!c || c < 2) return setError("Comprá debe ser ≥ 2");
      if (!pg || pg < 1 || pg >= c) return setError("Pagá debe ser ≥ 1 y menor que Comprá");
    }
    if (form.alcance === "producto" && !form.product_id) return setError("Seleccioná un producto");
    if (form.alcance === "categoria" && !form.category_id) return setError("Seleccioná una categoría");

    const input: PromoInput = {
      id: editing?.id,
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      tipo: form.tipo,
      alcance: form.alcance,
      product_id: form.alcance === "producto" ? form.product_id : null,
      category_id: form.alcance === "categoria" ? form.category_id : null,
      descuento_porcentaje: form.descuento_porcentaje ? parseFloat(form.descuento_porcentaje) : null,
      descuento_monto: form.descuento_monto ? Math.round(parseFloat(form.descuento_monto)) : null,
      nxm_compra: form.nxm_compra ? parseInt(form.nxm_compra) : null,
      nxm_paga: form.nxm_paga ? parseInt(form.nxm_paga) : null,
      cantidad_minima: form.cantidad_minima ? parseInt(form.cantidad_minima) : null,
      fecha_inicio: form.fecha_inicio ? `${form.fecha_inicio}T00:00:00` : null,
      fecha_fin: form.fecha_fin ? `${form.fecha_fin}T23:59:59` : null,
      activo: form.activo,
    };
    setSaving(true);
    setError("");
    try {
      await savePromotion(input);
      setModalOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await deletePromotion(id);
    setDeleting(null);
    router.refresh();
  }
  async function handleToggle(id: string, activo: boolean) {
    await togglePromotion(id, !activo);
    router.refresh();
  }

  function desc(p: PromotionRow) {
    switch (p.tipo) {
      case "porcentaje":
        return `${p.descuento_porcentaje}% de descuento`;
      case "monto_fijo":
        return `$${Number(p.descuento_monto).toLocaleString("es-AR")} por unidad`;
      case "nxm":
        return `Llevá ${p.nxm_compra}, pagá ${p.nxm_paga}`;
      case "cantidad_minima":
        return `${p.descuento_porcentaje}% desde ${p.cantidad_minima} unidades`;
    }
  }
  const target = (p: PromotionRow) => {
    if (p.alcance === "producto") return p.product?.name || "Producto";
    if (p.alcance === "categoria")
      return `Categoría ${p.category?.name || "—"} (incluye subcategorías)`;
    return "Todo el sitio";
  };
  const isExpired = (p: PromotionRow) => !!p.fecha_fin && new Date(p.fecha_fin) < new Date();
  const isUpcoming = (p: PromotionRow) => !!p.fecha_inicio && new Date(p.fecha_inicio) > new Date();

  const activas = promotions.filter((p) => p.activo && !isExpired(p));
  const inactivas = promotions.filter((p) => !p.activo || isExpired(p));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Promociones</h1>
          <p className="text-sm text-ink/50">Descuentos que se aplican solos al finalizar la compra.</p>
        </div>
        <button
          onClick={openNew}
          className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          + Nueva promoción
        </button>
      </div>

      <Section title={`Activas (${activas.length})`} empty="No hay promociones activas">
        {activas.map((p) => (
          <PromoCard
            key={p.id}
            p={p}
            desc={desc(p)!}
            target={target(p)}
            upcoming={isUpcoming(p)}
            deleting={deleting === p.id}
            onEdit={() => openEdit(p)}
            onAskDelete={() => setDeleting(p.id)}
            onCancelDelete={() => setDeleting(null)}
            onDelete={() => handleDelete(p.id)}
            onToggle={() => handleToggle(p.id, p.activo)}
          />
        ))}
      </Section>

      {inactivas.length > 0 && (
        <div className="mt-8 opacity-70">
          <Section title={`Inactivas / Vencidas (${inactivas.length})`} empty="">
            {inactivas.map((p) => (
              <PromoCard
                key={p.id}
                p={p}
                desc={desc(p)!}
                target={target(p)}
                upcoming={false}
                deleting={deleting === p.id}
                onEdit={() => openEdit(p)}
                onAskDelete={() => setDeleting(p.id)}
                onCancelDelete={() => setDeleting(null)}
                onDelete={() => handleDelete(p.id)}
                onToggle={() => handleToggle(p.id, p.activo)}
              />
            ))}
          </Section>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/5 bg-white px-6 py-4">
              <h3 className="font-display text-lg font-bold text-ink">
                {editing ? "Editar promoción" : "Nueva promoción"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-ink/40 hover:text-ink">
                ✕
              </button>
            </div>
            <div className="space-y-4 p-6">
              {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
              <label className="block text-sm font-medium text-ink">
                Nombre *
                <input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className={`mt-1.5 ${inputCls}`}
                  placeholder="Ej: 10% en todo"
                />
              </label>
              <label className="block text-sm font-medium text-ink">
                Descripción
                <input
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  className={`mt-1.5 ${inputCls}`}
                  placeholder="Opcional"
                />
              </label>

              <div>
                <span className="mb-1.5 block text-sm font-medium text-ink">Tipo de descuento</span>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(TIPO_LABELS) as PromoTipo[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, tipo: t })}
                      className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                        form.tipo === t
                          ? "border-brand bg-brand/10 font-medium text-brand"
                          : "border-black/10 text-ink/60 hover:border-black/20"
                      }`}
                    >
                      {TIPO_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              {(form.tipo === "porcentaje" || form.tipo === "cantidad_minima") && (
                <div className="grid grid-cols-2 gap-4">
                  {form.tipo === "cantidad_minima" && (
                    <label className="block text-sm font-medium text-ink">
                      Cantidad mínima
                      <input
                        type="number"
                        min={2}
                        value={form.cantidad_minima}
                        onChange={(e) => setForm({ ...form, cantidad_minima: e.target.value })}
                        className={`mt-1.5 ${inputCls}`}
                      />
                    </label>
                  )}
                  <label className="block text-sm font-medium text-ink">
                    % Descuento
                    <input
                      type="number"
                      min={1}
                      max={100}
                      step={0.5}
                      value={form.descuento_porcentaje}
                      onChange={(e) => setForm({ ...form, descuento_porcentaje: e.target.value })}
                      className={`mt-1.5 ${inputCls}`}
                      placeholder="10"
                    />
                  </label>
                </div>
              )}
              {form.tipo === "monto_fijo" && (
                <label className="block text-sm font-medium text-ink">
                  Monto de descuento por unidad ($)
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={form.descuento_monto}
                    onChange={(e) => setForm({ ...form, descuento_monto: e.target.value })}
                    className={`mt-1.5 ${inputCls}`}
                    placeholder="2000"
                  />
                </label>
              )}
              {form.tipo === "nxm" && (
                <div className="grid grid-cols-2 gap-4">
                  <label className="block text-sm font-medium text-ink">
                    Comprá
                    <input
                      type="number"
                      min={2}
                      value={form.nxm_compra}
                      onChange={(e) => setForm({ ...form, nxm_compra: e.target.value })}
                      className={`mt-1.5 ${inputCls}`}
                    />
                  </label>
                  <label className="block text-sm font-medium text-ink">
                    Pagá
                    <input
                      type="number"
                      min={1}
                      value={form.nxm_paga}
                      onChange={(e) => setForm({ ...form, nxm_paga: e.target.value })}
                      className={`mt-1.5 ${inputCls}`}
                    />
                  </label>
                  <p className="col-span-2 text-xs text-ink/40">
                    Ej: Comprá 3, Pagá 2 = el cliente lleva 3 y paga 2.
                  </p>
                </div>
              )}

              <label className="block text-sm font-medium text-ink">
                Se aplica a
                <select
                  value={form.alcance}
                  onChange={(e) => setForm({ ...form, alcance: e.target.value as PromoAlcance })}
                  className={`mt-1.5 ${inputCls}`}
                >
                  <option value="todo">Todo el sitio</option>
                  <option value="producto">Un producto específico</option>
                  <option value="categoria">Una categoría</option>
                </select>
              </label>
              {form.alcance === "producto" && (
                <label className="block text-sm font-medium text-ink">
                  Producto
                  <select
                    value={form.product_id}
                    onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                    className={`mt-1.5 ${inputCls}`}
                  >
                    <option value="">Seleccionar…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {form.alcance === "categoria" && (
                <label className="block text-sm font-medium text-ink">
                  Categoría
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    className={`mt-1.5 ${inputCls}`}
                  >
                    <option value="">Seleccionar…</option>
                    {catOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <span className="mt-1 block text-xs font-normal text-ink/40">
                    Si elegís una categoría padre, la promo también aplica a sus subcategorías.
                  </span>
                </label>
              )}

              <div className="grid grid-cols-2 gap-4">
                <label className="block text-sm font-medium text-ink">
                  Desde (opcional)
                  <input
                    type="date"
                    value={form.fecha_inicio}
                    onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                    className={`mt-1.5 ${inputCls}`}
                  />
                </label>
                <label className="block text-sm font-medium text-ink">
                  Hasta (opcional)
                  <input
                    type="date"
                    value={form.fecha_fin}
                    onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
                    className={`mt-1.5 ${inputCls}`}
                  />
                </label>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                  className="h-4 w-4 accent-brand"
                />
                Promoción activa
              </label>
            </div>
            <div className="sticky bottom-0 flex gap-3 border-t border-black/5 bg-white px-6 py-4">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 rounded-full border border-black/10 py-2.5 text-sm font-medium text-ink/70 hover:border-brand"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-full bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
              >
                {saving ? "Guardando…" : editing ? "Guardar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const arr = Array.isArray(children) ? children : [children];
  const isEmpty = arr.filter(Boolean).length === 0;
  return (
    <div>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink/40">{title}</h2>
      {isEmpty ? (
        <p className="py-4 text-sm text-ink/40">{empty}</p>
      ) : (
        <div className="grid gap-3">{children}</div>
      )}
    </div>
  );
}

function PromoCard({
  p,
  desc,
  target,
  upcoming,
  deleting,
  onEdit,
  onAskDelete,
  onCancelDelete,
  onDelete,
  onToggle,
}: {
  p: PromotionRow;
  desc: string;
  target: string;
  upcoming: boolean;
  deleting: boolean;
  onEdit: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-ink">{p.nombre}</h3>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TIPO_COLORS[p.tipo]}`}>
            {TIPO_LABELS[p.tipo]}
          </span>
          {upcoming && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              Programada
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-ink/70">{desc}</p>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/40">
          <span>
            Aplica a: <span className="text-ink/70">{target}</span>
          </span>
          {p.fecha_inicio && <span>Desde: {new Date(p.fecha_inicio).toLocaleDateString("es-AR")}</span>}
          {p.fecha_fin && <span>Hasta: {new Date(p.fecha_fin).toLocaleDateString("es-AR")}</span>}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {deleting ? (
          // Confirmación en dos pasos (patrón confirm-delete-button de Nalika)
          <>
            <span className="text-xs text-ink/50">¿Eliminar? No se puede deshacer.</span>
            <button
              onClick={onDelete}
              className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
            >
              Sí, eliminar
            </button>
            <button
              onClick={onCancelDelete}
              className="rounded-full px-2 py-1.5 text-xs text-ink/50 hover:text-ink"
            >
              Cancelar
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                p.activo ? "bg-save" : "bg-black/20"
              }`}
              title={p.activo ? "Desactivar" : "Activar"}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  p.activo ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <button
              onClick={onEdit}
              className="rounded-lg border border-black/10 px-3 py-1.5 text-xs text-ink/70 hover:border-brand"
            >
              Editar
            </button>
            <button
              onClick={onAskDelete}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
            >
              Eliminar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
