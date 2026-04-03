"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function InventoryFilters({
  currentQ,
  currentStatus,
}: {
  currentQ?: string;
  currentStatus?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentQ ?? "");

  function applyFilters(newQ?: string, newStatus?: string) {
    const params = new URLSearchParams(searchParams.toString());

    const q = newQ ?? search;
    if (q) params.set("q", q);
    else params.delete("q");

    if (newStatus !== undefined) {
      if (newStatus) params.set("status", newStatus);
      else params.delete("status");
    }

    router.push(`/admin/inventario?${params.toString()}`);
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
          placeholder="Buscar por nombre o SKU..."
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
        value={currentStatus ?? ""}
        onChange={(e) => applyFilters(undefined, e.target.value)}
        className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
      >
        <option value="">Todos los estados</option>
        <option value="out_of_stock">Agotado</option>
        <option value="low">Stock bajo</option>
        <option value="normal">Normal</option>
        <option value="overstock">Exceso (&gt;100)</option>
      </select>
    </div>
  );
}
