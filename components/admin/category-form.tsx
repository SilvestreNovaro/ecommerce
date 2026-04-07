"use client";

import type { Category } from "@/types";

export function CategoryForm({
  action,
  parentCategories,
}: {
  action: (formData: FormData) => Promise<void>;
  parentCategories: Category[];
}) {
  return (
    <form action={action} className="space-y-3">
      <input
        name="name"
        type="text"
        required
        placeholder="Nombre de la categoría"
        className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
      />
      <div className="flex gap-2">
        <select
          name="parent_id"
          className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="">Categoría principal</option>
          {parentCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              Subcategoría de: {cat.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Crear
        </button>
      </div>
    </form>
  );
}
