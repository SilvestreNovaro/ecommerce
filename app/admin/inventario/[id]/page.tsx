import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { StockAdjuster } from "@/components/admin/stock-adjuster";
import { updateProductInventorySettings } from "../actions";
import type { Product, StockMovement } from "@/types";

type Props = {
  params: Promise<{ id: string }>;
};

const TYPE_LABELS: Record<string, string> = {
  in: "Entrada",
  out: "Salida",
  adjustment: "Ajuste",
  sale: "Venta",
  return: "Devolución",
};

const TYPE_COLORS: Record<string, string> = {
  in: "text-green-600",
  out: "text-red-600",
  adjustment: "text-blue-600",
  sale: "text-red-600",
  return: "text-green-600",
};

export default async function ProductInventoryPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: product }, { data: movements }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).single(),
    supabase
      .from("stock_movements")
      .select("*")
      .eq("product_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (!product) notFound();

  const p = product as Product;
  const history = (movements ?? []) as StockMovement[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{p.name}</h2>
        <Link href="/admin/inventario" className="text-sm underline">
          Volver a inventario
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Product info & settings */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-white p-4">
            <h3 className="font-bold">Stock actual</h3>
            <p className="mt-2 text-4xl font-bold">{p.stock}</p>
            <div className="mt-3">
              <StockAdjuster
                productId={p.id}
                currentStock={p.stock}
                productName={p.name}
              />
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <h3 className="font-bold">Información</h3>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Precio venta</span>
                <span className="font-medium">{formatPrice(p.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Costo</span>
                <span className="font-medium">{formatPrice(p.cost_price)}</span>
              </div>
              {p.cost_price > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Margen</span>
                  <span className="font-medium">
                    {((1 - p.cost_price / p.price) * 100).toFixed(1)}%
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Valor en stock</span>
                <span className="font-medium">
                  {formatPrice(p.cost_price * p.stock)}
                </span>
              </div>
            </div>
          </div>

          <form
            action={updateProductInventorySettings}
            className="rounded-lg border bg-white p-4 space-y-3"
          >
            <h3 className="font-bold">Configuración</h3>
            <input type="hidden" name="id" value={p.id} />

            <div>
              <label className="block text-sm font-medium">SKU</label>
              <input
                name="sku"
                type="text"
                defaultValue={p.sku ?? ""}
                placeholder="Ej: PROD-001"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Precio de costo</label>
              <input
                name="cost_price"
                type="number"
                min="0"
                defaultValue={p.cost_price}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">
                Umbral stock bajo
              </label>
              <input
                name="low_stock_threshold"
                type="number"
                min="0"
                defaultValue={p.low_stock_threshold}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-black py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Guardar configuración
            </button>
          </form>
        </div>

        {/* Movement history */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border bg-white p-4">
            <h3 className="font-bold">Historial de movimientos</h3>

            {history.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">
                No hay movimientos registrados.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b text-gray-500">
                    <tr>
                      <th className="pb-3 font-medium">Fecha</th>
                      <th className="pb-3 font-medium">Tipo</th>
                      <th className="pb-3 font-medium">Cantidad</th>
                      <th className="pb-3 font-medium">Stock</th>
                      <th className="pb-3 font-medium">Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {history.map((mov) => (
                      <tr key={mov.id}>
                        <td className="py-3 text-gray-500">
                          {new Date(mov.created_at).toLocaleString("es-AR")}
                        </td>
                        <td className="py-3">
                          <span className={`font-medium ${TYPE_COLORS[mov.type] ?? ""}`}>
                            {TYPE_LABELS[mov.type] ?? mov.type}
                          </span>
                        </td>
                        <td className="py-3 font-mono">
                          <span
                            className={
                              mov.quantity > 0 ? "text-green-600" : "text-red-600"
                            }
                          >
                            {mov.quantity > 0 ? "+" : ""}
                            {mov.quantity}
                          </span>
                        </td>
                        <td className="py-3 text-gray-500">
                          {mov.previous_stock} → {mov.new_stock}
                        </td>
                        <td className="py-3 text-gray-500">
                          {mov.reason ?? "—"}
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
