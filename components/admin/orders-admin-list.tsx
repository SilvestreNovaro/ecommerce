"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ProductThumb from "@/components/admin/product-thumb";

const money = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(n) || 0);

const PAY: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pendiente de pago", cls: "bg-amber-100 text-amber-700" },
  paid: { label: "Pagado", cls: "bg-save/10 text-save" },
  rejected: { label: "Rechazado", cls: "bg-red-100 text-red-700" },
};
const LOG: Record<string, { label: string; cls: string }> = {
  received: { label: "Recibido", cls: "bg-black/5 text-ink/50" },
  preparing: { label: "En preparación", cls: "bg-blue-100 text-blue-700" },
  shipped: { label: "Enviado", cls: "bg-indigo-100 text-indigo-700" },
  delivered: { label: "Entregado", cls: "bg-save/10 text-save" },
  cancelled: { label: "Cancelado", cls: "bg-red-100 text-red-700" },
};
function badge(s: { label: string; cls: string }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>;
}

export type AdminOrderItem = {
  product_name: string;
  quantity: number;
  image: string | null;
};
export type AdminOrder = {
  id: string;
  order_number: number;
  created_at: string;
  customer_name: string;
  total: number;
  payment_method: string;
  payment_status: string;
  logistic_status: string;
  fulfillment: string;
  items: AdminOrderItem[];
};

export default function OrdersAdminList({ orders }: { orders: AdminOrder[] }) {
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [estado, setEstado] = useState(""); // logistic_status
  const [pago, setPago] = useState(""); // payment_status

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const fromTs = from ? new Date(`${from}T00:00:00`).getTime() : null;
    const toTs = to ? new Date(`${to}T23:59:59.999`).getTime() : null;
    return orders.filter((o) => {
      if (term) {
        const hay = `#${o.order_number} ${o.customer_name} ${o.id}`.toLowerCase();
        if (!term.split(/\s+/).every((w) => hay.includes(w))) return false;
      }
      if (estado && o.logistic_status !== estado) return false;
      if (pago && o.payment_status !== pago) return false;
      if (fromTs || toTs) {
        const ts = new Date(o.created_at).getTime();
        if (fromTs && ts < fromTs) return false;
        if (toTs && ts > toTs) return false;
      }
      return true;
    });
  }, [q, from, to, estado, pago, orders]);

  const inputCls =
    "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand";

  return (
    <div>
      {/* Búsqueda + fechas */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por N°, cliente o ID…"
            className={`${inputCls} w-full rounded-full pl-10`}
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
        <div className="flex items-center gap-2 text-sm text-ink/50">
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
              aria-label="Limpiar fechas"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filtros por estado logístico y por pago */}
      <div className="mb-3 flex flex-col gap-2">
        <FilterChips
          label="Estado"
          value={estado}
          onChange={setEstado}
          options={Object.entries(LOG).map(([k, v]) => ({ value: k, label: v.label }))}
        />
        <FilterChips
          label="Pago"
          value={pago}
          onChange={setPago}
          options={Object.entries(PAY).map(([k, v]) => ({ value: k, label: v.label }))}
        />
      </div>

      <p className="mb-3 text-xs text-ink/40">
        {filtered.length} de {orders.length} pedidos
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-black/5 bg-white p-10 text-center text-sm text-ink/50">
          Sin pedidos para el filtro aplicado.
        </div>
      ) : (
        <ul className="grid gap-4">
          {filtered.map((o) => {
            const logS =
              o.logistic_status === "delivered" && o.fulfillment === "pickup"
                ? { label: "Retirado", cls: "bg-save/10 text-save" }
                : LOG[o.logistic_status] || { label: o.logistic_status, cls: "bg-black/5 text-ink/50" };
            return (
              <li key={o.id} className="rounded-2xl border border-black/5 bg-white p-4">
                <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Link
                    href={`/admin/pedidos/${o.id}`}
                    className="font-display text-lg font-bold text-ink hover:underline"
                  >
                    Pedido #{o.order_number}
                  </Link>
                  {badge(PAY[o.payment_status] || { label: o.payment_status, cls: "bg-black/5 text-ink/50" })}
                  {badge(logS)}
                  <span className="ml-auto text-sm font-semibold text-ink">{money(o.total)}</span>
                </div>
                <p className="mb-3 text-xs text-ink/50">
                  {o.customer_name} · {new Date(o.created_at).toLocaleDateString("es-AR")} ·{" "}
                  {o.payment_method === "transfer" ? "Transferencia" : "Mercado Pago"}
                </p>
                <div className="flex flex-wrap gap-4">
                  {o.items.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-2 rounded-xl border border-black/5 p-2">
                      {it.image ? (
                        <ProductThumb url={it.image} alt={it.product_name} />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-black/10 text-lg">
                          🐾
                        </div>
                      )}
                      <p className="text-xs font-medium text-ink">
                        {it.product_name}
                        <span className="text-ink/40"> ×{it.quantity}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FilterChips({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const chip = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs font-medium transition-colors ${
      active ? "bg-ink text-white" : "bg-black/5 text-ink/60 hover:bg-black/10"
    }`;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 w-14 shrink-0 text-xs font-semibold text-ink/40">{label}</span>
      <button type="button" onClick={() => onChange("")} className={chip(value === "")}>
        Todos
      </button>
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)} className={chip(value === o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
