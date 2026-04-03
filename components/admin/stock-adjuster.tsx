"use client";

import { useState } from "react";
import { adjustStock } from "@/app/admin/inventario/actions";

const TYPES = [
  { value: "in", label: "Entrada" },
  { value: "out", label: "Salida" },
  { value: "adjustment", label: "Ajuste" },
  { value: "return", label: "Devolución" },
] as const;

export function StockAdjuster({
  productId,
  currentStock,
  productName,
}: {
  productId: string;
  currentStock: number;
  productName: string;
}) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(0);
  const [type, setType] = useState<"in" | "out" | "adjustment" | "return">("in");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (quantity === 0) return;

    setLoading(true);
    setError("");

    const adjustment = type === "out"
      ? -Math.abs(quantity)
      : Math.abs(quantity);

    try {
      await adjustStock(productId, adjustment, type, reason);
      setOpen(false);
      setQuantity(0);
      setReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al ajustar stock");
    }

    setLoading(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
      >
        Ajustar
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg space-y-4"
      >
        <h3 className="font-bold">Ajustar stock: {productName}</h3>
        <p className="text-sm text-gray-500">Stock actual: {currentStock}</p>

        <div>
          <label className="block text-sm font-medium">Tipo de movimiento</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Cantidad</label>
          <input
            type="number"
            min="1"
            value={quantity || ""}
            onChange={(e) => setQuantity(Number(e.target.value))}
            required
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-gray-400">
            Nuevo stock:{" "}
            {type === "out"
              ? currentStock - Math.abs(quantity)
              : currentStock + Math.abs(quantity)}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium">Motivo</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej: Compra a proveedor, Rotura..."
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || quantity === 0}
            className="flex-1 rounded-md bg-black py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Confirmar"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex-1 rounded-md border py-2 text-sm font-medium hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
