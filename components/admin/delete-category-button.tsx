"use client";

import { deleteCategory } from "@/app/admin/categorias/actions";

export function DeleteCategoryButton({ categoryId }: { categoryId: string }) {
  async function handleDelete() {
    if (!confirm("¿Eliminar esta categoría?")) return;
    await deleteCategory(categoryId);
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
