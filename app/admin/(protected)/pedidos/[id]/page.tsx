import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSection } from "@/lib/admin-auth";
import { confirmTransferPayment, setLogisticStatus } from "../actions";
import ProductThumb from "@/components/admin/product-thumb";

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
function Badge({ map, value }: { map: typeof PAY; value: string }) {
  const s = map[value] || { label: value, cls: "bg-black/5 text-ink/50" };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>;
}
// Badge logístico consciente del tipo de entrega: "Retirado" si es retiro.
function LogBadge({ status, fulfillment }: { status: string; fulfillment: string }) {
  const s =
    status === "delivered" && fulfillment === "pickup"
      ? { label: "Retirado", cls: "bg-save/10 text-save" }
      : LOG[status] || { label: status, cls: "bg-black/5 text-ink/50" };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>;
}

type Item = {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

export default async function AdminPedidoDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireSection("pedidos");
  const { id } = await params;
  const admin = createAdminClient();

  const { data: order } = await admin.from("orders").select("*").eq("id", id).maybeSingle();
  if (!order) notFound();

  const { data: itemsData } = await admin
    .from("order_items")
    .select("id, product_id, product_name, quantity, unit_price, subtotal")
    .eq("order_id", id);
  const items = (itemsData ?? []) as Item[];

  const productIds = items.map((i) => i.product_id).filter(Boolean) as string[];
  const productImg = new Map<string, string | null>();
  if (productIds.length > 0) {
    const { data: prods } = await admin.from("products").select("id, image_url").in("id", productIds);
    for (const p of prods ?? []) productImg.set(p.id, p.image_url);
  }

  const isPendingTransfer = order.payment_method === "transfer" && order.payment_status === "pending";

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/pedidos" className="text-sm text-ink/50 hover:text-ink">
          ← Volver a pedidos
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-extrabold text-ink">Pedido #{order.order_number}</h1>
          <Badge map={PAY} value={order.payment_status} />
          <LogBadge status={order.logistic_status} fulfillment={order.fulfillment} />
        </div>
        <p className="text-sm text-ink/40">{new Date(order.created_at).toLocaleString("es-AR")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Ítems */}
        <div className="grid gap-3">
          <h2 className="font-display font-bold text-ink">Ítems del pedido</h2>
          {items.map((it) => {
            const img = it.product_id ? (productImg.get(it.product_id) ?? null) : null;
            return (
              <div key={it.id} className="flex gap-4 rounded-2xl border border-black/5 bg-white p-4">
                {img ? (
                  <ProductThumb url={img} alt={it.product_name} size="h-20 w-20" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-black/10 text-2xl">
                    🐾
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-ink">{it.product_name}</p>
                  <p className="text-xs text-ink/50">
                    ×{it.quantity} · {money(it.unit_price)} c/u
                  </p>
                </div>
                <div className="text-right text-sm font-semibold text-ink">{money(it.subtotal)}</div>
              </div>
            );
          })}
          <div className="flex justify-between rounded-2xl border border-black/5 bg-white px-4 py-3 font-semibold text-ink">
            <span>Total</span>
            <span>{money(order.total)}</span>
          </div>
        </div>

        {/* Panel lateral: cliente, entrega, acciones */}
        <aside className="grid h-fit gap-4">
          <div className="rounded-2xl border border-black/5 bg-white p-4 text-sm">
            <h3 className="mb-2 font-semibold text-ink">Cliente</h3>
            <p className="text-ink/70">{order.customer_name}</p>
            <p className="text-ink/50">{order.customer_email}</p>
            <p className="text-ink/50">{order.customer_phone}</p>
          </div>

          <div className="rounded-2xl border border-black/5 bg-white p-4 text-sm">
            <h3 className="mb-2 font-semibold text-ink">Entrega</h3>
            <p className="text-ink/70">{order.fulfillment === "delivery" ? "Envío a domicilio" : "Retiro en Nalika"}</p>
            {order.fulfillment === "delivery" && (
              <p className="mt-1 text-ink/50">
                {[order.ship_address, order.ship_city, order.ship_province, order.ship_zip]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </p>
            )}
            {order.ship_notes && <p className="mt-1 text-xs text-ink/40">Nota: {order.ship_notes}</p>}
          </div>

          {/* Acciones */}
          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-ink">Acciones</h3>

            {isPendingTransfer && (
              <form action={confirmTransferPayment} className="mb-2">
                <input type="hidden" name="id" value={order.id} />
                <button
                  type="submit"
                  className="w-full rounded-full bg-save px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                >
                  ✓ Confirmar pago (transferencia)
                </button>
              </form>
            )}

            {order.logistic_status === "preparing" &&
              (order.fulfillment === "pickup" ? (
                <LogBtn id={order.id} status="delivered" label="Marcar como retirado" />
              ) : (
                <LogBtn id={order.id} status="shipped" label="Marcar como enviado" />
              ))}
            {order.logistic_status === "shipped" && (
              <LogBtn id={order.id} status="delivered" label="Marcar como entregado" />
            )}
            {["received", "preparing", "shipped"].includes(order.logistic_status) && (
              <LogBtn id={order.id} status="cancelled" label="Cancelar pedido" variant="danger" />
            )}
            {order.logistic_status === "delivered" && (
              <p className="text-sm text-ink/50">
                {order.fulfillment === "pickup" ? "Pedido retirado ✓" : "Pedido entregado ✓"}
              </p>
            )}
            {order.payment_status === "pending" &&
              order.logistic_status === "received" &&
              order.payment_method !== "transfer" && (
                <p className="text-xs text-ink/40">Esperando confirmación de Mercado Pago.</p>
              )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function LogBtn({
  id,
  status,
  label,
  variant,
}: {
  id: string;
  status: string;
  label: string;
  variant?: "danger";
}) {
  return (
    <form action={setLogisticStatus} className="mb-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className={`w-full rounded-full px-4 py-2.5 text-sm font-semibold ${
          variant === "danger"
            ? "border border-red-200 text-red-600 hover:bg-red-50"
            : "bg-brand text-white hover:bg-brand-dark"
        }`}
      >
        {label}
      </button>
    </form>
  );
}
