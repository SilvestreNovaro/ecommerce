import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

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

export default async function AdminPage() {
  const supabase = await createClient();

  const [
    { count: productCount },
    { count: orderCount },
    { count: userCount },
    { data: recentOrders },
    { data: allOrders },
    { data: lowStockProducts },
    { data: orderItems },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("id, status, total, created_at, profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("orders").select("total, status"),
    supabase
      .from("products")
      .select("id, name, stock, slug")
      .lte("stock", 5)
      .eq("active", true)
      .order("stock", { ascending: true })
      .limit(5),
    supabase
      .from("order_items")
      .select("product_id, quantity, products(name)"),
  ]);

  const totalRevenue = (allOrders ?? [])
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrders = (allOrders ?? []).filter(
    (o) => o.status === "pending"
  ).length;

  // Orders by status
  const ordersByStatus = (allOrders ?? []).reduce<Record<string, number>>(
    (acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    },
    {}
  );

  // Top selling products
  const salesByProduct = new Map<string, { name: string; sold: number }>();
  for (const item of orderItems ?? []) {
    const product = Array.isArray(item.products)
      ? item.products[0]
      : item.products;
    const name = (product as { name: string } | null)?.name ?? "—";
    const existing = salesByProduct.get(item.product_id) ?? {
      name,
      sold: 0,
    };
    existing.sold += item.quantity;
    salesByProduct.set(item.product_id, existing);
  }
  const topProducts = [...salesByProduct.values()]
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  const stats = [
    { label: "Productos", value: productCount ?? 0 },
    { label: "Órdenes", value: orderCount ?? 0 },
    { label: "Usuarios", value: userCount ?? 0 },
    { label: "Ingresos totales", value: formatPrice(totalRevenue) },
    { label: "Pendientes", value: pendingOrders },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="flex gap-2">
          <Link
            href="/admin/productos/nuevo"
            className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            + Producto
          </Link>
          <Link
            href="/admin/categorias"
            className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
          >
            + Categoría
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-white p-4">
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Orders by status */}
        <div className="rounded-lg border bg-white p-4">
          <h3 className="font-bold">Órdenes por estado</h3>
          {Object.keys(ordersByStatus).length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">Sin datos.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {Object.entries(ordersByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[status] ?? "bg-gray-100"}`}
                  >
                    {STATUS_LABELS[status] ?? status}
                  </span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top products */}
        <div className="rounded-lg border bg-white p-4">
          <h3 className="font-bold">Más vendidos</h3>
          {topProducts.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">Sin ventas todavía.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm truncate max-w-[180px]">
                    {p.name}
                  </span>
                  <span className="text-sm font-medium">
                    {p.sold} vendidos
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low stock alert */}
        <div className="rounded-lg border bg-white p-4">
          <h3 className="font-bold">Stock bajo</h3>
          {!lowStockProducts || lowStockProducts.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">
              Todo en orden.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {lowStockProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <Link
                    href={`/admin/productos/${p.id}`}
                    className="text-sm truncate max-w-[180px] underline"
                  >
                    {p.name}
                  </Link>
                  <span
                    className={`text-sm font-medium ${p.stock === 0 ? "text-red-600" : "text-yellow-600"}`}
                  >
                    {p.stock === 0 ? "Agotado" : `${p.stock} uds`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Órdenes recientes</h3>
          <Link href="/admin/ordenes" className="text-sm underline">
            Ver todas
          </Link>
        </div>

        {!recentOrders || recentOrders.length === 0 ? (
          <p className="mt-4 text-gray-500">No hay órdenes todavía.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-gray-500">
                <tr>
                  <th className="pb-3 font-medium">Orden</th>
                  <th className="pb-3 font-medium">Cliente</th>
                  <th className="pb-3 font-medium">Total</th>
                  <th className="pb-3 font-medium">Estado</th>
                  <th className="pb-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentOrders.map((order) => {
                  const profile = Array.isArray(order.profiles)
                    ? order.profiles[0]
                    : order.profiles;
                  return (
                    <tr key={order.id}>
                      <td className="py-3">
                        <Link
                          href={`/admin/ordenes/${order.id}`}
                          className="font-mono text-xs underline"
                        >
                          #{order.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="py-3">
                        {(profile as { full_name: string | null } | null)
                          ?.full_name ?? "—"}
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
