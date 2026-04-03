import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export default async function CuentaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Mi cuenta</h1>

      <div className="mt-6 rounded-lg border p-6">
        <p className="font-medium">{profile?.full_name ?? "Usuario"}</p>
        <p className="text-sm text-gray-500">{profile?.email}</p>
      </div>

      <h2 className="mt-12 text-2xl font-bold">Mis órdenes</h2>

      {!orders || orders.length === 0 ? (
        <p className="mt-4 text-gray-500">No tenés órdenes todavía.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-mono text-sm">#{order.id.slice(0, 8)}</p>
                <p className="text-xs text-gray-500">
                  {new Date(order.created_at).toLocaleDateString("es-AR")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">{formatPrice(order.total)}</p>
                <span className="inline-block mt-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
