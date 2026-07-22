"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Botón de eliminar con confirmación en dos pasos (patrón SUK, sin dialog).
// Recibe una server action que toma FormData con "id".
export default function ConfirmDeleteButton({
  action,
  id,
  label = "Eliminar",
  message = "Esta acción no se puede deshacer.",
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  label?: string;
  message?: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onConfirm() {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("id", id);
      await action(fd);
      router.refresh();
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-2">
        <span className="max-w-[280px] text-xs text-ink/50">{message}</span>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {busy ? "Eliminando…" : "Sí, eliminar"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={busy}
          className="rounded-full px-3 py-2 text-sm text-ink/50 hover:text-ink"
        >
          Cancelar
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
    >
      {label}
    </button>
  );
}
