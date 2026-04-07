"use client";

import { useState } from "react";
import {
  getCategoryProductCount,
  deleteCategoryOnly,
  deleteCategoryWithProducts,
} from "@/app/admin/categorias/actions";

export function DeleteCategoryButton({
  categoryId,
  categoryName,
}: {
  categoryId: string;
  categoryName: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [productCount, setProductCount] = useState<number | null>(null);

  async function handleClick() {
    setLoading(true);
    const count = await getCategoryProductCount(categoryId);
    setProductCount(count);
    setLoading(false);

    if (count === 0) {
      if (confirm(`¿Eliminar la categoría "${categoryName}"?`)) {
        await deleteCategoryOnly(categoryId);
      }
    } else {
      setOpen(true);
    }
  }

  async function handleDeleteKeepProducts() {
    setLoading(true);
    await deleteCategoryOnly(categoryId);
    setOpen(false);
    setLoading(false);
  }

  async function handleDeleteWithProducts() {
    if (
      !confirm(
        `¿Estás seguro? Esto eliminará "${categoryName}" y sus ${productCount} productos PERMANENTEMENTE.`
      )
    )
      return;
    setLoading(true);
    await deleteCategoryWithProducts(categoryId);
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
            <h3 className="text-lg font-bold">
              Eliminar &quot;{categoryName}&quot;
            </h3>
            <p className="text-sm text-gray-600">
              Esta categoría tiene{" "}
              <span className="font-bold">{productCount}</span>{" "}
              {productCount === 1 ? "producto" : "productos"} asignados. ¿Qué
              querés hacer?
            </p>

            <div className="space-y-3">
              <button
                onClick={handleDeleteKeepProducts}
                disabled={loading}
                className="w-full rounded-md border py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Eliminar categoría y desvincular productos
                <span className="block text-xs text-gray-400 font-normal mt-0.5">
                  Los productos quedan sin categoría
                </span>
              </button>

              <button
                onClick={handleDeleteWithProducts}
                disabled={loading}
                className="w-full rounded-md bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Eliminar categoría y todos sus productos
                <span className="block text-xs text-red-200 font-normal mt-0.5">
                  Acción irreversible
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
