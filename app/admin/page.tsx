import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

export default async function AdminPage() {
  const supabase = await createClient();

  const [
    { count: productCount },
    { count: orderCount },
    { count: userCount },
    { data: recentOrders },
    { data: allOrders },
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
  ]);

  const totalRevenue = (allOrders ?? [])
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrders = (allOrders ?? []).filter(
    (o) => o.status === "pending"
  ).length;

  const stats = [
    { label: "Productos", value: productCount ?? 0 },
    { label: "Órdenes", value: orderCount ?? 0 },
    { label: "Usuarios", value: userCount ?? 0 },
    { label: "Ingresos totales", value: formatPrice(totalRevenue) },
    { label: "Órdenes pendientes", value: pendingOrders },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold">Dashboard</h2>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-white p-4">
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

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
                        {(profile as { full_name: string | null } | null)?.full_name ?? "—"}
                      </td>
                      <td className="py-3 font-medium">
                        {formatPrice(order.total)}
                      </td>
                      <td className="py-3">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500">
                        {new Date(order.created_at).toLocaleDateString("es-AR")}
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
