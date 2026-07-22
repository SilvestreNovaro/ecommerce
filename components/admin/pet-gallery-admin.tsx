"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  uploadPetPhotos,
  updatePetPhoto,
  reorderPetPhotos,
  replacePetPhotoImage,
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
  const replaceRef = useRef<HTMLInputElement>(null);
  const replaceId = useRef<string | null>(null);
  const dragIndex = useRef<number | null>(null);
  const [list, setList] = useState(photos);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // El server component re-renderiza tras router.refresh(): sincronizamos.
  const serverKey = photos.map((p) => p.id).join(",");
  const [lastServerKey, setLastServerKey] = useState(serverKey);
  if (serverKey !== lastServerKey) {
    setLastServerKey(serverKey);
    setList(photos);
  }

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

  async function persistOrder(next: PetPhotoRow[]) {
    setList(next);
    try {
      await reorderPetPhotos(next.map((p) => p.id));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al reordenar");
    }
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    void persistOrder(next);
  }

  function onDrop(overIndex: number) {
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === overIndex) return;
    const next = [...list];
    const [moved] = next.splice(from, 1);
    next.splice(overIndex, 0, moved);
    void persistOrder(next);
  }

  async function replaceImage(file: File) {
    const id = replaceId.current;
    replaceId.current = null;
    if (!id) return;
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.set("id", id);
      fd.set("file", file);
      await replacePetPhotoImage(fd);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al reemplazar la imagen");
    } finally {
      setBusy(false);
      if (replaceRef.current) replaceRef.current.value = "";
    }
  }

  async function toggle(p: PetPhotoRow) {
    await updatePetPhoto(p.id, { active: !p.active });
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
          <h1 className="font-display text-2xl font-extrabold text-ink">Galería Mascotas 🐾</h1>
          <p className="text-sm text-ink/50">
            El nombre/descripción se muestra sobre la foto en la tienda. Arrastrá las cards para
            reordenar.
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
        <input
          ref={replaceRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={(e) => e.target.files?.[0] && replaceImage(e.target.files[0])}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
        >
          {busy ? "Procesando…" : "+ Subir fotos"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      )}

      {list.length === 0 ? (
        <div className="rounded-2xl border border-black/5 bg-white p-10 text-center text-sm text-ink/50">
          Todavía no hay fotos. Subí las primeras con “+ Subir fotos” (PNG, JPG o WebP, hasta
          8MB cada una). Mientras no haya fotos activas, la sección no se muestra en la tienda.
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((p, index) => (
            <li
              key={p.id}
              draggable
              onDragStart={() => {
                dragIndex.current = index;
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(index)}
              className={`cursor-grab overflow-hidden rounded-2xl border border-black/5 bg-white active:cursor-grabbing ${
                p.active ? "" : "opacity-60"
              }`}
            >
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image_url} alt={p.alt || ""} className="aspect-square w-full object-cover" />
                <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white">
                  #{index + 1}
                </span>
                <button
                  onClick={() => {
                    replaceId.current = p.id;
                    replaceRef.current?.click();
                  }}
                  disabled={busy}
                  className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-ink shadow hover:bg-white"
                  title="Reemplazar la imagen manteniendo nombre y orden"
                >
                  🔄 Cambiar foto
                </button>
              </div>
              <div className="space-y-2 p-3">
                <input
                  defaultValue={p.alt || ""}
                  placeholder="Nombre de la mascota (ej: Toby 🐶)"
                  maxLength={200}
                  onBlur={(e) => saveAlt(p, e.target.value)}
                  className="w-full rounded-lg border border-black/10 px-2 py-1 text-xs outline-none focus:border-brand"
                />
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex gap-1">
                    <button
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      className="rounded border border-black/10 px-1.5 py-0.5 text-xs text-ink/60 hover:border-brand disabled:opacity-30"
                      title="Mover antes"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => move(index, 1)}
                      disabled={index === list.length - 1}
                      className="rounded border border-black/10 px-1.5 py-0.5 text-xs text-ink/60 hover:border-brand disabled:opacity-30"
                      title="Mover después"
                    >
                      →
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
                  compact
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
