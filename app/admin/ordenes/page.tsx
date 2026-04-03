import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { OrderStatusSelect } from "@/components/admin/order-status-select";

type ProfileInfo = { email: string; full_name: string | null };

type OrderRow = {
  id: string;
  status: string;
  total: number;
  shipping_address: string;
  created_at: string;
  profiles: ProfileInfo | ProfileInfo[] | null;
};

export default async function AdminOrdenesPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("orders")
    .select("id, status, total, shipping_address, created_at, profiles(email, full_name)")
    .order("created_at", { ascending: false });

  const orders = (data ?? []).map((row) => {
    const p = row.profiles;
    const profile = Array.isArray(p) ? p[0] ?? null : p;
    return { ...row, profiles: profile } as OrderRow & { profiles: ProfileInfo | null };
  });

  return (
    <div>
      <h2 className="text-2xl font-bold">Órdenes</h2>

      {orders.length === 0 ? (
        <p className="mt-8 text-gray-500">No hay órdenes todavía.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-gray-500">
              <tr>
                <th className="pb-3 font-medium">Orden</th>
                <th className="pb-3 font-medium">Cliente</th>
                <th className="pb-3 font-medium">Total</th>
                <th className="pb-3 font-medium">Estado</th>
                <th className="pb-3 font-medium">Fecha</th>
                <th className="pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="py-3 font-mono text-xs">
                    #{order.id.slice(0, 8)}
                  </td>
                  <td className="py-3">
                    <div>{order.profiles?.full_name ?? "—"}</div>
                    <div className="text-xs text-gray-500">
                      {order.profiles?.email}
                    </div>
                  </td>
                  <td className="py-3 font-medium">
                    {formatPrice(order.total)}
                  </td>
                  <td className="py-3">
                    <OrderStatusSelect
                      orderId={order.id}
                      currentStatus={order.status}
                    />
                  </td>
                  <td className="py-3 text-gray-500">
                    {new Date(order.created_at).toLocaleDateString("es-AR")}
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
  );
}
