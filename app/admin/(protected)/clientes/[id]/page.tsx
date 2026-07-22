import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSection } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

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

export default async function AdminClienteDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireSection("clientes");
  const { id } = await params;
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, email, full_name, phone, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!profile) notFound();

  const { data: orders } = await admin
    .from("orders")
    .select("id, order_number, total, payment_status, logistic_status, fulfillment, created_at")
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  const list = orders ?? [];
  const totalSpent = list
    .filter((o) => o.logistic_status !== "cancelled")
    .reduce((a, o) => a + (Number(o.total) || 0), 0);

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/clientes" className="text-sm text-ink/50 hover:text-brand">
          ← Volver a clientes
        </Link>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">
          {profile.full_name || profile.email}
        </h1>
        <p className="text-sm text-ink/40">
          Cliente desde {new Date(profile.created_at).toLocaleDateString("es-AR")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Datos + stats */}
        <aside className="grid h-fit gap-4">
          <div className="rounded-2xl border border-black/5 bg-white p-4 text-sm">
            <h3 className="mb-2 font-semibold text-ink">Datos</h3>
            <p className="text-ink/70">{profile.email}</p>
            <p className="text-ink/50">{profile.phone || "Sin teléfono"}</p>
            <p className="mt-1 font-mono text-[10px] text-ink/30">{profile.id}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-black/5 bg-white p-4 text-center">
              <p className="font-display text-2xl font-extrabold text-ink">{list.length}</p>
              <p className="text-xs text-ink/50">Pedidos</p>
            </div>
            <div className="rounded-2xl border border-black/5 bg-white p-4 text-center">
              <p className="font-display text-2xl font-extrabold text-save">{money(totalSpent)}</p>
              <p className="text-xs text-ink/50">Total (s/cancelados)</p>
            </div>
          </div>
        </aside>

        {/* Pedidos del cliente */}
        <div>
          <h2 className="mb-3 font-display font-bold text-ink">Pedidos</h2>
          {list.length === 0 ? (
            <div className="rounded-2xl border border-black/5 bg-white p-8 text-center text-sm text-ink/50">
              Todavía no hizo pedidos.
            </div>
          ) : (
            <ul className="grid gap-2">
              {list.map((o) => {
                const logS =
                  o.logistic_status === "delivered" && o.fulfillment === "pickup"
                    ? { label: "Retirado", cls: "bg-save/10 text-save" }
                    : LOG[o.logistic_status] || { label: o.logistic_status, cls: "bg-black/5 text-ink/50" };
                return (
                  <li key={o.id}>
                    <Link
                      href={`/admin/pedidos/${o.id}`}
                      className="flex flex-wrap items-center gap-3 rounded-xl border border-black/5 bg-white p-3 transition-colors hover:border-brand/40"
                    >
                      <span className="font-semibold text-ink">#{o.order_number}</span>
                      {badge(PAY[o.payment_status] || { label: o.payment_status, cls: "bg-black/5 text-ink/50" })}
                      {badge(logS)}
                      <span className="text-xs text-ink/40">
                        {new Date(o.created_at).toLocaleDateString("es-AR")}
                      </span>
                      <span className="ml-auto text-sm font-semibold text-ink">{money(o.total)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
