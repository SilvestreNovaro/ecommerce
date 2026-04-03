import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

type Props = {
  params: Promise<{ id: string }>;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default async function ClienteDetallePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  const clientOrders = orders ?? [];
  const activeOrders = clientOrders.filter((o) => o.status !== "cancelled");
  const totalSpent = activeOrders.reduce((sum, o) => sum + o.total, 0);
  const avgOrder = activeOrders.length > 0 ? totalSpent / activeOrders.length : 0;

  // Get most purchased products
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("quantity, products(name)")
    .in(
      "order_id",
      clientOrders.map((o) => o.id)
    );

  const productCounts = new Map<string, { name: string; qty: number }>();
  for (const item of orderItems ?? []) {
    const product = Array.isArray(item.products)
      ? item.products[0]
      : item.products;
    const name = (product as { name: string } | null)?.name ?? "—";
    const existing = productCounts.get(name) ?? { name, qty: 0 };
    existing.qty += item.quantity;
    productCounts.set(name, existing);
  }
  const topProducts = [...productCounts.values()]
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {profile.full_name ?? "Sin nombre"}
        </h2>
        <Link href="/admin/clientes" className="text-sm underline">
          Volver a clientes
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-white p-4">
            <h3 className="font-bold">Información</h3>
            <div className="mt-3 space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Email: </span>
                <span>{profile.email}</span>
              </div>
              <div>
                <span className="text-gray-500">Rol: </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    profile.role === "admin"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {profile.role === "admin" ? "Admin" : "Cliente"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Registrado: </span>
                <span>
                  {new Date(profile.created_at).toLocaleDateString("es-AR")}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <h3 className="font-bold">Resumen de compras</h3>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Órdenes</span>
                <span className="font-medium">{activeOrders.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total gastado</span>
                <span className="font-medium">{formatPrice(totalSpent)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ticket promedio</span>
                <span className="font-medium">
                  {formatPrice(Math.round(avgOrder))}
                </span>
              </div>
            </div>
          </div>

          {topProducts.length > 0 && (
            <div className="rounded-lg border bg-white p-4">
              <h3 className="font-bold">Productos favoritos</h3>
              <div className="mt-3 space-y-2">
                {topProducts.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="truncate max-w-[180px]">{p.name}</span>
                    <span className="text-gray-500">{p.qty} uds</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Order history */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border bg-white p-4">
            <h3 className="font-bold">Historial de órdenes</h3>

            {clientOrders.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">
                Este cliente no tiene órdenes.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b text-gray-500">
                    <tr>
                      <th className="pb-3 font-medium">Orden</th>
                      <th className="pb-3 font-medium">Total</th>
                      <th className="pb-3 font-medium">Estado</th>
                      <th className="pb-3 font-medium">Fecha</th>
                      <th className="pb-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {clientOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="py-3 font-mono text-xs">
                          #{order.id.slice(0, 8)}
                        </td>
                        <td className="py-3 font-medium">
                          {formatPrice(order.total)}
                        </td>
                        <td className="py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[order.status] ?? "bg-gray-100"}`}
                          >
                            {STATUS_LABELS[order.status] ?? order.status}
                          </span>
                        </td>
                        <td className="py-3 text-gray-500">
                          {new Date(order.created_at).toLocaleDateString(
                            "es-AR"
                          )}
                        </td>
                        <td className="py-3">
                          <Link
                            href={`/admin/ordenes/${order.id}`}
                            className="text-sm underline"
                          >
                            Ver
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
