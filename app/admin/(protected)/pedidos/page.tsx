import { createAdminClient } from "@/lib/supabase/admin";
import { requireSection } from "@/lib/admin-auth";
import OrdersAdminList, { type AdminOrder } from "@/components/admin/orders-admin-list";

export const dynamic = "force-dynamic";

type OrderRow = {
  id: string;
  order_number: number;
  created_at: string;
  customer_name: string;
  total: number;
  payment_method: string;
  payment_status: string;
  logistic_status: string;
  fulfillment: string;
};
type ItemRow = {
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
};

export default async function AdminPedidosPage() {
  await requireSection("pedidos");
  const admin = createAdminClient();
  const { data: ordersData, error } = await admin
    .from("orders")
    .select(
      "id, order_number, created_at, customer_name, total, payment_method, payment_status, logistic_status, fulfillment"
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return <p className="text-sm text-red-600">Error cargando pedidos: {error.message}</p>;
  const orders = (ordersData ?? []) as OrderRow[];

  const orderIds = orders.map((o) => o.id);
  let items: ItemRow[] = [];
  const prodImg = new Map<string, string | null>();
  if (orderIds.length > 0) {
    const { data: it } = await admin
      .from("order_items")
      .select("order_id, product_id, product_name, quantity")
      .in("order_id", orderIds);
    items = (it ?? []) as ItemRow[];
    const productIds = Array.from(new Set(items.map((i) => i.product_id).filter(Boolean) as string[]));
    if (productIds.length > 0) {
      const { data: ps } = await admin.from("products").select("id, image_url").in("id", productIds);
      for (const p of ps ?? []) prodImg.set(p.id, p.image_url);
    }
  }
  const itemsByOrder = new Map<string, ItemRow[]>();
  for (const i of items) {
    const arr = itemsByOrder.get(i.order_id) || [];
    arr.push(i);
    itemsByOrder.set(i.order_id, arr);
  }

  const enriched: AdminOrder[] = orders.map((o) => ({
    ...o,
    items: (itemsByOrder.get(o.id) || []).map((it) => ({
      product_name: it.product_name,
      quantity: it.quantity,
      image: it.product_id ? (prodImg.get(it.product_id) ?? null) : null,
    })),
  }));

  const pendientes = orders.filter((o) => o.payment_status === "pending").length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold text-ink">Pedidos</h1>
        <p className="text-sm text-ink/50">
          {orders.length} {orders.length === 1 ? "pedido" : "pedidos"}
          {pendientes > 0 ? ` · ${pendientes} esperando pago` : ""}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-black/5 bg-white p-10 text-center text-sm text-ink/50">
          Todavía no hay pedidos.
        </div>
      ) : (
        <OrdersAdminList orders={enriched} />
      )}
    </div>
  );
}
