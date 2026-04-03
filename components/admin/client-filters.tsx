"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function ClientFilters({
  currentQ,
  currentSort,
}: {
  currentQ?: string;
  currentSort?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentQ ?? "");

  function applyFilters(newQ?: string, newSort?: string) {
    const params = new URLSearchParams(searchParams.toString());

    const q = newQ ?? search;
    if (q) params.set("q", q);
    else params.delete("q");

    if (newSort !== undefined) {
      if (newSort) params.set("sort", newSort);
      else params.delete("sort");
    }

    router.push(`/admin/clientes?${params.toString()}`);
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
          placeholder="Buscar por nombre o email..."
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
        value={currentSort ?? ""}
        onChange={(e) => applyFilters(undefined, e.target.value)}
        className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
      >
        <option value="">Más recientes</option>
        <option value="spent">Mayor gasto</option>
        <option value="orders">Más órdenes</option>
      </select>
    </div>
  );
}
