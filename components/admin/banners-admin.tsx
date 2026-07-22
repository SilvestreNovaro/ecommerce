"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  saveBanner,
  deleteBanner,
  toggleBanner,
  setBannerOrden,
  uploadBannerImage,
  type BannerInput,
} from "@/app/admin/(protected)/banners/actions";
import { BANNER_SECTIONS } from "@/lib/banner-sections";
import ConfirmDeleteButton from "@/components/admin/confirm-delete-button";

export type BannerRow = {
  id: string;
  section: string;
  eyebrow: string | null;
  titulo: string | null;
  subtitulo: string | null;
  cta_label: string | null;
  cta_href: string | null;
  image_desktop_url: string | null;
  image_mobile_url: string | null;
  bg: string | null;
  text_light: boolean;
  orden: number;
  activo: boolean;
};

const inputCls =
  "w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand";

const EMPTY: BannerInput = {
  section: "home",
  eyebrow: "",
  titulo: "",
  subtitulo: "",
  cta_label: "",
  cta_href: "",
  image_desktop_url: null,
  image_mobile_url: null,
  bg: "linear-gradient(135deg,#16171d,#3a3a4a)",
  text_light: true,
  orden: 0,
  activo: true,
};

export default function BannersAdmin({ banners }: { banners: BannerRow[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BannerRow | null>(null);
  const [form, setForm] = useState<BannerInput>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function openNew(section: string) {
    setEditing(null);
    setForm({ ...EMPTY, section, orden: banners.filter((b) => b.section === section).length });
    setError("");
    setModalOpen(true);
  }
  function openEdit(b: BannerRow) {
    setEditing(b);
    setForm({
      id: b.id,
      section: b.section,
      eyebrow: b.eyebrow || "",
      titulo: b.titulo || "",
      subtitulo: b.subtitulo || "",
      cta_label: b.cta_label || "",
      cta_href: b.cta_href || "",
      image_desktop_url: b.image_desktop_url,
      image_mobile_url: b.image_mobile_url,
      bg: b.bg || "",
      text_light: b.text_light,
      orden: b.orden,
      activo: b.activo,
    });
    setError("");
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await saveBanner(form);
      setModalOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }
  async function handleToggle(b: BannerRow) {
    await toggleBanner(b.id, !b.activo);
    router.refresh();
  }
  async function move(b: BannerRow, dir: -1 | 1) {
    await setBannerOrden(b.id, b.orden + dir);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink">Banners</h1>
        <p className="text-sm text-ink/50">
          Banners por sección del sitio. En Inicio ocupan toda la pantalla; en las páginas
          internas son una franja arriba.
        </p>
      </div>

      {BANNER_SECTIONS.map((s) => {
        const items = banners.filter((b) => b.section === s.value);
        return (
          <div key={s.value} className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-ink/40">
                {s.label} <span className="font-mono lowercase text-ink/30">{s.path}</span>
              </h2>
              <button
                onClick={() => openNew(s.value)}
                className="rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
              >
                + Banner
              </button>
            </div>
            <div className="grid gap-3">
              {items.length === 0 ? (
                <p className="text-sm text-ink/40">Sin banners en esta sección.</p>
              ) : (
                items.map((b) => (
                  <BannerCard
                    key={b.id}
                    b={b}
                    onEdit={() => openEdit(b)}
                    onToggle={() => handleToggle(b)}
                    onUp={() => move(b, -1)}
                    onDown={() => move(b, 1)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}

      {modalOpen && (
        <BannerModal
          form={form}
          setForm={setForm}
          editing={!!editing}
          saving={saving}
          error={error}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function BannerCard({
  b,
  onEdit,
  onToggle,
  onUp,
  onDown,
}: {
  b: BannerRow;
  onEdit: () => void;
  onToggle: () => void;
  onUp: () => void;
  onDown: () => void;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-4 rounded-2xl border border-black/5 bg-white p-3 ${
        b.activo ? "" : "opacity-60"
      }`}
    >
      <div
        className="h-16 w-28 shrink-0 overflow-hidden rounded-lg border border-black/5"
        style={{ background: b.bg || "#16171d" }}
      >
        {b.image_desktop_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={b.image_desktop_url} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink">{b.titulo || b.eyebrow || "(sin título)"}</p>
        <p className="truncate text-xs text-ink/50">{b.subtitulo || "—"}</p>
        <p className="text-[10px] text-ink/30">
          orden {b.orden}
          {b.cta_href ? ` · → ${b.cta_href}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        <button
          onClick={onUp}
          className="rounded-lg border border-black/10 px-2 py-1 text-xs text-ink/60 hover:border-brand"
          title="Subir"
        >
          ↑
        </button>
        <button
          onClick={onDown}
          className="rounded-lg border border-black/10 px-2 py-1 text-xs text-ink/60 hover:border-brand"
          title="Bajar"
        >
          ↓
        </button>
        <button
          onClick={onToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            b.activo ? "bg-save" : "bg-black/20"
          }`}
          title={b.activo ? "Desactivar" : "Activar"}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              b.activo ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <button
          onClick={onEdit}
          className="rounded-lg border border-black/10 px-3 py-1.5 text-xs text-ink/70 hover:border-brand"
        >
          Editar
        </button>
        <ConfirmDeleteButton
          action={deleteBanner}
          id={b.id}
          message="Se borra el banner y sus imágenes."
        />
      </div>
    </div>
  );
}

function ImageField({
  label,
  url,
  onChange,
}: {
  label: string;
  url: string | null;
  onChange: (url: string | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function pick(file: File) {
    setBusy(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { url } = await uploadBannerImage(fd);
      onChange(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al subir");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <div className="flex items-center gap-3">
        <div className="h-14 w-24 shrink-0 overflow-hidden rounded-lg border border-black/10 bg-cloud">
          {url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <input
          ref={ref}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])}
        />
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={busy}
          className="rounded-lg border border-black/10 px-3 py-1.5 text-xs text-ink/70 hover:border-brand disabled:opacity-50"
        >
          {busy ? "Subiendo…" : url ? "Cambiar" : "Subir"}
        </button>
        {url && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-red-600 hover:underline"
          >
            Quitar
          </button>
        )}
      </div>
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  );
}

function BannerModal({
  form,
  setForm,
  editing,
  saving,
  error,
  onClose,
  onSave,
}: {
  form: BannerInput;
  setForm: (f: BannerInput) => void;
  editing: boolean;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/5 bg-white px-6 py-4">
          <h3 className="text-lg font-bold text-ink">{editing ? "Editar banner" : "Nuevo banner"}</h3>
          <button onClick={onClose} className="text-ink/40 hover:text-ink">
            ✕
          </button>
        </div>
        <div className="space-y-4 p-6">
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

          <label className="block text-sm font-medium text-ink">
            Sección del sitio
            <select
              value={form.section}
              onChange={(e) => setForm({ ...form, section: e.target.value })}
              className={`mt-1.5 ${inputCls}`}
            >
              {BANNER_SECTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-lg bg-cloud px-3 py-2.5 text-xs leading-relaxed text-ink/60">
            📐 <strong className="text-ink/80">Medidas recomendadas</strong> — en{" "}
            <strong>Inicio el banner ocupa toda la pantalla</strong>:
            <br />• <strong>Desktop:</strong> 1920 × 1080 px (apaisada, 16:9)
            <br />• <strong>Mobile:</strong> 1080 × 1920 px (vertical, 9:16)
            <br />
            Formato JPG o WebP, ideal &lt;1 MB. Dejá aire en el centro: el título y el botón se
            superponen.
          </div>
          <ImageField
            label="Imagen desktop (apaisada · 1920×1080)"
            url={form.image_desktop_url}
            onChange={(url) => setForm({ ...form, image_desktop_url: url })}
          />
          <ImageField
            label="Imagen mobile (vertical · 1080×1920)"
            url={form.image_mobile_url}
            onChange={(url) => setForm({ ...form, image_mobile_url: url })}
          />

          <label className="block text-sm font-medium text-ink">
            Fondo (CSS, si no hay imagen)
            <input
              value={form.bg ?? ""}
              onChange={(e) => setForm({ ...form, bg: e.target.value })}
              className={`mt-1.5 ${inputCls}`}
              placeholder="linear-gradient(135deg,#16171d,#3a3a4a)"
            />
          </label>
          <div className="h-10 rounded-lg border border-black/10" style={{ background: form.bg || "#16171d" }} />

          <label className="block text-sm font-medium text-ink">
            Eyebrow (línea chica arriba)
            <input
              value={form.eyebrow ?? ""}
              onChange={(e) => setForm({ ...form, eyebrow: e.target.value })}
              className={`mt-1.5 ${inputCls}`}
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            Título
            <input
              value={form.titulo ?? ""}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              className={`mt-1.5 ${inputCls}`}
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            Subtítulo
            <input
              value={form.subtitulo ?? ""}
              onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
              className={`mt-1.5 ${inputCls}`}
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm font-medium text-ink">
              Texto del botón
              <input
                value={form.cta_label ?? ""}
                onChange={(e) => setForm({ ...form, cta_label: e.target.value })}
                className={`mt-1.5 ${inputCls}`}
              />
            </label>
            <label className="block text-sm font-medium text-ink">
              Link del botón
              <input
                value={form.cta_href ?? ""}
                onChange={(e) => setForm({ ...form, cta_href: e.target.value })}
                className={`mt-1.5 ${inputCls}`}
                placeholder="/productos"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm font-medium text-ink">
              Orden
              <input
                type="number"
                value={form.orden}
                onChange={(e) => setForm({ ...form, orden: parseInt(e.target.value) || 0 })}
                className={`mt-1.5 ${inputCls}`}
              />
            </label>
            <div className="flex flex-col justify-end gap-2 pb-1">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={form.text_light}
                  onChange={(e) => setForm({ ...form, text_light: e.target.checked })}
                  className="h-4 w-4 accent-brand"
                />{" "}
                Texto claro
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                  className="h-4 w-4 accent-brand"
                />{" "}
                Activo
              </label>
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 flex gap-3 border-t border-black/5 bg-white px-6 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-black/10 py-2.5 text-sm font-medium text-ink/70 hover:border-brand"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex-1 rounded-full bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {saving ? "Guardando…" : editing ? "Guardar" : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
}
