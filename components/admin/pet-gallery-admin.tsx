"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  uploadPetPhotos,
  updatePetPhoto,
  setPetPhotoOrden,
  deletePetPhoto,
} from "@/app/admin/(protected)/galeria/actions";
import ConfirmDeleteButton from "@/components/admin/confirm-delete-button";

export type PetPhotoRow = {
  id: string;
  image_url: string;
  alt: string | null;
  orden: number;
  active: boolean;
};

export default function PetGalleryAdmin({ photos }: { photos: PetPhotoRow[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(files: FileList) {
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      for (const f of Array.from(files)) fd.append("files", f);
      await uploadPetPhotos(fd);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  async function toggle(p: PetPhotoRow) {
    await updatePetPhoto(p.id, { active: !p.active });
    router.refresh();
  }
  async function move(p: PetPhotoRow, dir: -1 | 1) {
    await setPetPhotoOrden(p.id, p.orden + dir);
    router.refresh();
  }
  async function saveAlt(p: PetPhotoRow, alt: string) {
    if (alt.trim() === (p.alt || "")) return;
    await updatePetPhoto(p.id, { alt });
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Galería Mascotas 🐾</h1>
          <p className="text-sm text-ink/50">
            Fotos de mascotas de clientes que se muestran en la home y en /galeria. La
            descripción aparece como epígrafe (ej: “Toby estrenando su camita”).
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          hidden
          onChange={(e) => e.target.files?.length && upload(e.target.files)}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
        >
          {busy ? "Subiendo…" : "+ Subir fotos"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      )}

      {photos.length === 0 ? (
        <div className="rounded-2xl border border-black/5 bg-white p-10 text-center text-sm text-ink/50">
          Todavía no hay fotos. Subí las primeras con “+ Subir fotos” (PNG, JPG o WebP, hasta
          8MB cada una). Mientras no haya fotos activas, la sección no se muestra en la tienda.
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((p) => (
            <li
              key={p.id}
              className={`overflow-hidden rounded-2xl border border-black/5 bg-white ${
                p.active ? "" : "opacity-60"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image_url} alt={p.alt || ""} className="aspect-square w-full object-cover" />
              <div className="space-y-2 p-3">
                <input
                  defaultValue={p.alt || ""}
                  placeholder="Descripción (ej: Toby estrenando su camita)"
                  maxLength={200}
                  onBlur={(e) => saveAlt(p, e.target.value)}
                  className="w-full rounded-lg border border-black/10 px-2 py-1 text-xs outline-none focus:border-brand"
                />
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex gap-1">
                    <button
                      onClick={() => move(p, -1)}
                      className="rounded border border-black/10 px-1.5 text-xs text-ink/60 hover:border-brand"
                      title="Subir en el orden"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => move(p, 1)}
                      className="rounded border border-black/10 px-1.5 text-xs text-ink/60 hover:border-brand"
                      title="Bajar en el orden"
                    >
                      ↓
                    </button>
                  </div>
                  <button
                    onClick={() => toggle(p)}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      p.active ? "bg-save/10 text-save" : "bg-black/5 text-ink/40"
                    }`}
                  >
                    {p.active ? "Activa" : "Oculta"}
                  </button>
                </div>
                <ConfirmDeleteButton
                  action={deletePetPhoto}
                  id={p.id}
                  message="Se borra de la galería y del almacenamiento."
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
