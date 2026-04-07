"use client";

import { useState } from "react";
import {
  deleteProduct,
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

  async function handleForceDelete() {
    if (
      !confirm(
        "Esto eliminará el producto y sus registros de ventas. ¿Estás seguro?"
      )
    )
      return;
    setLoading(true);
    await deleteProduct(productId, true);
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
              {orderCount === 1 ? "orden" : "órdenes"} de compra.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleForceDelete}
                disabled={loading}
                className="w-full rounded-md bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Eliminar producto y registros de ventas
                <span className="block text-xs text-red-200 font-normal mt-0.5">
                  Las órdenes perderán el detalle de este producto
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
