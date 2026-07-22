"use client";

import { useRef, useState } from "react";
import {
  addProductImage,
  deleteProductImage,
  reorderProductImages,
} from "@/app/admin/(protected)/catalogo/actions";

export type ProductImage = { id: string; url: string };

const ALLOWED = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;

export default function ProductImagesManager({
  productId,
  initial,
}: {
  productId: string;
  initial: ProductImage[];
}) {
  const [images, setImages] = useState<ProductImage[]>(initial);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const dragFrom = useRef<number | null>(null);

  async function uploadFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    const bad = arr.find((f) => !ALLOWED.includes(f.type) || f.size > MAX_BYTES);
    if (bad) {
      setErr(
        !ALLOWED.includes(bad.type)
          ? `"${bad.name}": formato inválido (solo PNG, JPG o WEBP).`
          : `"${bad.name}": supera los 8MB.`
      );
      return;
    }
    if (!arr.length) return;
    setBusy(true);
    setErr("");
    try {
      const added: ProductImage[] = [];
      for (const f of arr) {
        const fd = new FormData();
        fd.set("id", productId);
        fd.set("file", f);
        const r = await addProductImage(fd);
        added.push({ id: r.id, url: r.url });
      }
      setImages((prev) => [...prev, ...added]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al subir");
    } finally {
      setBusy(false);
    }
  }

  async function del(id: string) {
    setImages((prev) => prev.filter((i) => i.id !== id));
    await deleteProductImage(id);
  }

  async function applyOrder(next: ProductImage[]) {
    setImages(next);
    await reorderProductImages(productId, next.map((i) => i.id));
  }

  async function move(index: number, dir: -1 | 1) {
    const to = index + dir;
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [m] = next.splice(index, 1);
    next.splice(to, 0, m);
    await applyOrder(next);
  }

  async function drop(to: number) {
    const from = dragFrom.current;
    dragFrom.current = null;
    if (from === null || from === to) return;
    const next = [...images];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    await applyOrder(next);
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); uploadFiles(e.dataTransfer.files); }}
        className={`mb-3 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${over ? "border-brand bg-brand/5" : "border-black/10"}`}
      >
        <p className="text-sm text-ink/50">Arrastrá imágenes acá {busy && "· subiendo…"}</p>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="mt-2 rounded-full border border-black/10 px-4 py-1.5 text-xs font-medium text-ink/70 hover:border-brand hover:text-brand disabled:opacity-50"
        >
          o elegir archivos
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {err && <p className="mb-2 text-xs text-red-600">{err}</p>}

      {images.length === 0 ? (
        <p className="text-xs text-ink/40">Sin imágenes aún. Subí una o varias.</p>
      ) : (
        <>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {images.map((im, i) => (
              <li
                key={im.id}
                draggable
                onDragStart={() => (dragFrom.current = i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => drop(i)}
                className="group relative aspect-square cursor-grab overflow-hidden rounded-lg border border-black/5 active:cursor-grabbing"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={im.url} alt="" className="h-full w-full object-cover" />
                {i === 0 && (
                  <span className="absolute left-1 top-1 rounded-full bg-ink/80 px-2 py-0.5 text-[9px] font-semibold text-white">
                    Portada
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => del(im.id)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-xs text-red-600 opacity-0 shadow transition-opacity group-hover:opacity-100"
                  aria-label="Quitar imagen"
                >
                  ✕
                </button>
                <span className="absolute bottom-1 right-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-[10px] text-ink shadow disabled:opacity-40"
                    aria-label="Mover antes"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === images.length - 1}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-[10px] text-ink shadow disabled:opacity-40"
                    aria-label="Mover después"
                  >
                    ↓
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-ink/40">
            La primera (Portada) es la que aparece en las cards de la tienda. Arrastrá o usá ↑/↓ para reordenar.
          </p>
        </>
      )}
    </div>
  );
}
