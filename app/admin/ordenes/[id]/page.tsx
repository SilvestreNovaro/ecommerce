import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { OrderStatusSelect } from "@/components/admin/order-status-select";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function OrdenDetallePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (!order) notFound();

  const [{ data: items }, { data: profile }] = await Promise.all([
    supabase
      .from("order_items")
      .select("*, products(name, slug, image_url)")
      .eq("order_id", id),
    supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", order.user_id)
      .single(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Orden #{order.id.slice(0, 8)}
        </h2>
        <Link href="/admin/ordenes" className="text-sm underline">
          Volver a órdenes
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Productos</h3>
            <div className="mt-3 divide-y">
              {(items ?? []).map((item: Record<string, unknown>) => {
                const product = item.products as { name: string; slug: string; image_url: string | null } | null;
                return (
                  <div key={item.id as string} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">{product?.name ?? "Producto eliminado"}</p>
                      <p className="text-sm text-gray-500">
                        {item.quantity as number} x {formatPrice(item.unit_price as number)}
                      </p>
                    </div>
                    <p className="font-bold">
                      {formatPrice((item.unit_price as number) * (item.quantity as number))}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 border-t pt-3 flex justify-between font-bold">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Cliente</h3>
            <div className="mt-2 text-sm">
              <p>{profile?.full_name ?? "—"}</p>
              <p className="text-gray-500">{profile?.email}</p>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Dirección de envío</h3>
            <p className="mt-2 text-sm whitespace-pre-line text-gray-600">
              {order.shipping_address || "—"}
            </p>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Estado</h3>
            <div className="mt-2">
              <OrderStatusSelect
                orderId={order.id}
                currentStatus={order.status}
              />
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Fechas</h3>
            <div className="mt-2 text-sm text-gray-500 space-y-1">
              <p>Creada: {new Date(order.created_at).toLocaleString("es-AR")}</p>
              <p>Actualizada: {new Date(order.updated_at).toLocaleString("es-AR")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
