"use client";

import { useState } from "react";
import {
  deleteProduct,
  deactivateProduct,
  getProductOrderCount,
} from "@/app/admin/productos/actions";

export function DeleteProductButton({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderCount, setOrderCount] = useState(0);

  async function handleClick() {
    setLoading(true);
    const count = await getProductOrderCount(productId);
    setLoading(false);

    if (count === 0) {
      if (confirm("¿Eliminar este producto?")) {
        await deleteProduct(productId);
      }
    } else {
      setOrderCount(count);
      setOpen(true);
    }
  }

  async function handleDeactivate() {
    setLoading(true);
    await deactivateProduct(productId);
    setOpen(false);
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className="text-sm text-red-500 hover:underline disabled:opacity-50"
      >
        {loading ? "..." : "Eliminar"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg space-y-4">
            <h3 className="text-lg font-bold">Producto con ventas</h3>
            <p className="text-sm text-gray-600">
              Este producto aparece en{" "}
              <span className="font-bold">{orderCount}</span>{" "}
              {orderCount === 1 ? "orden" : "órdenes"} de compra. No se puede
              eliminar porque se perdería el historial de ventas.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleDeactivate}
                disabled={loading}
                className="w-full rounded-md bg-black py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                Desactivar producto
                <span className="block text-xs text-gray-300 font-normal mt-0.5">
                  Se oculta de la tienda pero se conserva el historial
                </span>
              </button>

              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="w-full rounded-md border py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
