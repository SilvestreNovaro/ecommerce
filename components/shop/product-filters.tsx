"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { Category } from "@/types";

export function ProductFilters({
  categories,
  currentQ,
  currentCategory,
  currentSort,
  totalResults,
}: {
  categories: Category[];
  currentQ?: string;
  currentCategory?: string;
  currentSort?: string;
  totalResults: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentQ ?? "");

  function navigate(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(overrides)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`/productos?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ q: search || undefined });
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar productos..."
          className="flex-1 rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          Buscar
        </button>
        {currentQ && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              navigate({ q: undefined });
            }}
            className="rounded-lg border px-3 py-2.5 text-sm hover:bg-gray-50"
          >
            Limpiar
          </button>
        )}
      </form>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => navigate({ category: undefined })}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            !currentCategory
              ? "bg-black text-white"
              : "border hover:bg-gray-50"
          }`}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() =>
              navigate({
                category: currentCategory === cat.slug ? undefined : cat.slug,
              })
            }
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              currentCategory === cat.slug
                ? "bg-black text-white"
                : "border hover:bg-gray-50"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Sort + results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {totalResults} {totalResults === 1 ? "producto" : "productos"}
          {currentQ && (
            <span>
              {" "}
              para &quot;<span className="font-medium">{currentQ}</span>&quot;
            </span>
          )}
        </p>
        <select
          value={currentSort ?? ""}
          onChange={(e) => navigate({ sort: e.target.value || undefined })}
          className="rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">Más recientes</option>
          <option value="price_asc">Menor precio</option>
          <option value="price_desc">Mayor precio</option>
          <option value="name">Nombre A-Z</option>
        </select>
      </div>
    </div>
  );
}
