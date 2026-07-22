"use client";

import { useState } from "react";

const inputCls =
  "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand";

export default function ExportForm() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  function download(type: "pedidos" | "clientes") {
    const params = new URLSearchParams({ type });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    window.location.href = `/api/admin/export?${params.toString()}`;
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="rounded-2xl border border-black/5 bg-white p-5">
        <h2 className="mb-1 font-display font-bold text-ink">Rango de fechas</h2>
        <p className="mb-3 text-sm text-ink/50">Filtra los pedidos por fecha. Vacío = todos. (No aplica a clientes.)</p>
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink/60">
          <span>Desde</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
          <span>hasta</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
          {(from || to) && (
            <button
              type="button"
              onClick={() => {
                setFrom("");
                setTo("");
              }}
              className="text-ink/40 hover:text-ink"
              aria-label="Limpiar"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => download("pedidos")}
          className="rounded-2xl border border-black/5 bg-white p-5 text-left transition-colors hover:border-brand/40"
        >
          <p className="font-display font-bold text-ink">📦 Pedidos</p>
          <p className="mt-1 text-sm text-ink/50">
            Una fila por ítem: N°, fecha, método y estado de pago, logística, entrega, cliente, producto, cantidad,
            precios y total.
          </p>
          <span className="mt-3 inline-block rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white">
            Descargar CSV
          </span>
        </button>
        <button
          onClick={() => download("clientes")}
          className="rounded-2xl border border-black/5 bg-white p-5 text-left transition-colors hover:border-brand/40"
        >
          <p className="font-display font-bold text-ink">👥 Clientes</p>
          <p className="mt-1 text-sm text-ink/50">
            Nombre, email, teléfono, cantidad de pedidos, total gastado, alta y último pedido.
          </p>
          <span className="mt-3 inline-block rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white">
            Descargar CSV
          </span>
        </button>
      </div>
    </div>
  );
}
