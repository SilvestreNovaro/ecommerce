"use client";

import { deleteProduct } from "@/app/admin/productos/actions";

export function DeleteProductButton({ productId }: { productId: string }) {
  async function handleDelete() {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;
    await deleteProduct(productId);
  }

  return (
    <button
      onClick={handleDelete}
      className="text-sm text-red-500 hover:underline"
    >
      Eliminar
    </button>
  );
}
