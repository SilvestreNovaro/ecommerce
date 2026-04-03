import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { ClientFilters } from "@/components/admin/client-filters";

type Props = {
  searchParams: Promise<{ q?: string; sort?: string }>;
};

type ClientRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
};

export default async function AdminClientesPage({ searchParams }: Props) {
  const { q, sort } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("profiles").select("*");

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
  }

  query = query.order("created_at", { ascending: false });

  const { data: profiles } = await query;
  const clients = (profiles ?? []) as ClientRow[];

  // Get order stats for all clients
  const { data: allOrders } = await supabase
    .from("orders")
    .select("user_id, total, status");

  const orderStats = new Map<
    string,
    { count: number; total: number }
  >();

  for (const order of allOrders ?? []) {
    if (order.status === "cancelled") continue;
    const existing = orderStats.get(order.user_id) ?? { count: 0, total: 0 };
    existing.count += 1;
    existing.total += order.total;
    orderStats.set(order.user_id, existing);
  }

  // Sort clients
  let sortedClients = clients.map((c) => ({
    ...c,
    orders: orderStats.get(c.id)?.count ?? 0,
    totalSpent: orderStats.get(c.id)?.total ?? 0,
  }));

  if (sort === "spent") {
    sortedClients.sort((a, b) => b.totalSpent - a.totalSpent);
  } else if (sort === "orders") {
    sortedClients.sort((a, b) => b.orders - a.orders);
  }

  // Summary
  const totalClients = sortedClients.length;
  const clientsWithOrders = sortedClients.filter((c) => c.orders > 0).length;
  const totalRevenue = sortedClients.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgOrderValue =
    clientsWithOrders > 0 ? totalRevenue / sortedClients.reduce((sum, c) => sum + c.orders, 0) : 0;

  return (
    <div>
      <h2 className="text-2xl font-bold">Clientes</h2>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500">Total clientes</p>
          <p className="mt-1 text-2xl font-bold">{totalClients}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500">Con compras</p>
          <p className="mt-1 text-2xl font-bold">{clientsWithOrders}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500">Ingresos totales</p>
          <p className="mt-1 text-2xl font-bold">{formatPrice(totalRevenue)}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500">Ticket promedio</p>
          <p className="mt-1 text-2xl font-bold">{formatPrice(Math.round(avgOrderValue))}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6">
        <ClientFilters currentQ={q} currentSort={sort} />
      </div>

      {/* Table */}
      {sortedClients.length === 0 ? (
        <p className="mt-8 text-gray-500">No se encontraron clientes.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-gray-500">
              <tr>
                <th className="pb-3 font-medium">Cliente</th>
                <th className="pb-3 font-medium">Rol</th>
                <th className="pb-3 font-medium">Órdenes</th>
                <th className="pb-3 font-medium">Total gastado</th>
                <th className="pb-3 font-medium">Registrado</th>
                <th className="pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedClients.map((client) => (
                <tr key={client.id}>
                  <td className="py-3">
                    <div className="font-medium">
                      {client.full_name ?? "Sin nombre"}
                    </div>
                    <div className="text-xs text-gray-500">{client.email}</div>
                  </td>
                  <td className="py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        client.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {client.role === "admin" ? "Admin" : "Cliente"}
                    </span>
                  </td>
                  <td className="py-3 font-medium">{client.orders}</td>
                  <td className="py-3 font-medium">
                    {formatPrice(client.totalSpent)}
                  </td>
                  <td className="py-3 text-gray-500">
                    {new Date(client.created_at).toLocaleDateString("es-AR")}
                  </td>
                  <td className="py-3">
                    <Link
                      href={`/admin/clientes/${client.id}`}
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
  );
}
