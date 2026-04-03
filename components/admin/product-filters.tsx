"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { Category } from "@/types";

export function ProductFilters({
  categories,
  currentQ,
  currentCategory,
}: {
  categories: Category[];
  currentQ?: string;
  currentCategory?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentQ ?? "");

  function applyFilters(newQ?: string, newCategory?: string) {
    const params = new URLSearchParams(searchParams.toString());

    const q = newQ ?? search;
    if (q) params.set("q", q);
    else params.delete("q");

    if (newCategory !== undefined) {
      if (newCategory) params.set("category", newCategory);
      else params.delete("category");
    }

    router.push(`/admin/productos?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          applyFilters();
        }}
        className="flex flex-1 gap-2"
      >
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre..."
          className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
        <button
          type="submit"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Buscar
        </button>
      </form>

      <select
        value={currentCategory ?? ""}
        onChange={(e) => applyFilters(undefined, e.target.value)}
        className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
      >
        <option value="">Todas las categorías</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>
    </div>
  );
}
