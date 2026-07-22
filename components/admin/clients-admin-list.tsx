"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const money = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(n) || 0);

export type AdminClient = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
  createdAt: string;
};

export default function ClientsAdminList({ clients }: { clients: AdminClient[] }) {
  const [q, setQ] = useState("");
  const [soloConPedidos, setSoloConPedidos] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return clients.filter((c) => {
      if (soloConPedidos && c.orderCount === 0) return false;
      if (!term) return true;
      const hay = `${c.name || ""} ${c.email} ${c.phone || ""} ${c.id}`.toLowerCase();
      return term.split(/\s+/).every((w) => hay.includes(w));
    });
  }, [q, soloConPedidos, clients]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, email, teléfono o ID…"
            className="w-full rounded-full border border-black/10 bg-white px-4 py-2.5 pl-10 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30">🔍</span>
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink/40 hover:text-ink"
              aria-label="Limpiar"
            >
              ✕
            </button>
          )}
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink/60">
          <input
            type="checkbox"
            checked={soloConPedidos}
            onChange={(e) => setSoloConPedidos(e.target.checked)}
            className="h-4 w-4 accent-brand"
          />
          Solo con pedidos
        </label>
      </div>

      <p className="mb-3 text-xs text-ink/40">
        {filtered.length} de {clients.length} clientes
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-black/5 bg-white p-10 text-center text-sm text-ink/50">
          Sin clientes para el filtro aplicado.
        </div>
      ) : (
        <ul className="grid gap-3">
          {filtered.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/clientes/${c.id}`}
                className="flex flex-wrap items-center gap-4 rounded-2xl border border-black/5 bg-white p-4 transition-colors hover:border-brand/40"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 font-semibold text-brand">
                  {(c.name?.[0] || c.email[0] || "?").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{c.name || "—"}</p>
                  <p className="truncate text-sm text-ink/50">
                    {c.email}
                    {c.phone ? ` · ${c.phone}` : ""}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold text-ink">
                    {c.orderCount} {c.orderCount === 1 ? "pedido" : "pedidos"}
                  </p>
                  <p className="text-ink/50">{money(c.totalSpent)}</p>
                </div>
                <div className="hidden text-right text-xs text-ink/40 sm:block">
                  <p>Alta: {new Date(c.createdAt).toLocaleDateString("es-AR")}</p>
                  {c.lastOrderAt && <p>Último: {new Date(c.lastOrderAt).toLocaleDateString("es-AR")}</p>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
