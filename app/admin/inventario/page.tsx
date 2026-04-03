import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { StockAdjuster } from "@/components/admin/stock-adjuster";
import { InventoryFilters } from "@/components/admin/inventory-filters";
import { ExportCsvButton } from "@/components/admin/export-csv-button";

type Props = {
  searchParams: Promise<{ q?: string; status?: string }>;
};

type InventoryProduct = {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  cost_price: number;
  price: number;
  low_stock_threshold: number;
  active: boolean;
  categories: { name: string } | { name: string }[] | null;
};

function getStockStatus(stock: number, threshold: number) {
  if (stock === 0) return { label: "Agotado", color: "bg-red-100 text-red-700" };
  if (stock <= threshold) return { label: "Bajo", color: "bg-yellow-100 text-yellow-700" };
  if (stock > 100) return { label: "Exceso", color: "bg-blue-100 text-blue-700" };
  return { label: "Normal", color: "bg-green-100 text-green-700" };
}

export default async function InventarioPage({ searchParams }: Props) {
  const { q, status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("id, name, sku, stock, cost_price, price, low_stock_threshold, active, categories(name)")
    .order("stock", { ascending: true });

  if (q) {
    query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`);
  }

  const { data } = await query;
  let products = (data ?? []) as InventoryProduct[];

  // Filter by stock status client-side
  if (status === "out_of_stock") {
    products = products.filter((p) => p.stock === 0);
  } else if (status === "low") {
    products = products.filter((p) => p.stock > 0 && p.stock <= p.low_stock_threshold);
  } else if (status === "normal") {
    products = products.filter((p) => p.stock > p.low_stock_threshold && p.stock <= 100);
  } else if (status === "overstock") {
    products = products.filter((p) => p.stock > 100);
  }

  // Summary stats
  const totalProducts = products.length;
  const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);
  const totalValue = products.reduce((sum, p) => sum + p.cost_price * p.stock, 0);
  const totalRetailValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const lowStock = products.filter(
    (p) => p.stock > 0 && p.stock <= p.low_stock_threshold
  ).length;

  const csvData = products.map((p) => ({
    name: p.name,
    sku: p.sku,
    stock: p.stock,
    cost_price: p.cost_price,
    price: p.price,
    category: (Array.isArray(p.categories) ? p.categories[0]?.name : p.categories?.name) ?? "—",
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Inventario</h2>
        <ExportCsvButton data={csvData} />
      </div>

      {/* Summary cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500">Productos</p>
          <p className="mt-1 text-2xl font-bold">{totalProducts}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500">Unidades totales</p>
          <p className="mt-1 text-2xl font-bold">{totalUnits.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500">Valor (costo)</p>
          <p className="mt-1 text-2xl font-bold">{formatPrice(totalValue)}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500">Valor (venta)</p>
          <p className="mt-1 text-2xl font-bold">{formatPrice(totalRetailValue)}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500">Agotados</p>
          <p className={`mt-1 text-2xl font-bold ${outOfStock > 0 ? "text-red-600" : ""}`}>
            {outOfStock}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500">Stock bajo</p>
          <p className={`mt-1 text-2xl font-bold ${lowStock > 0 ? "text-yellow-600" : ""}`}>
            {lowStock}
          </p>
        </div>
      </div>

      {/* Margin summary */}
      {totalValue > 0 && (
        <div className="mt-4 rounded-lg border bg-white p-4">
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-gray-500">Margen potencial: </span>
              <span className="font-bold">
                {formatPrice(totalRetailValue - totalValue)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Margen %: </span>
              <span className="font-bold">
                {((1 - totalValue / totalRetailValue) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mt-6">
        <InventoryFilters currentQ={q} currentStatus={status} />
      </div>

      {/* Product table */}
      {products.length === 0 ? (
        <p className="mt-8 text-gray-500">No se encontraron productos.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-gray-500">
              <tr>
                <th className="pb-3 font-medium">Producto</th>
                <th className="pb-3 font-medium">SKU</th>
                <th className="pb-3 font-medium">Stock</th>
                <th className="pb-3 font-medium">Estado</th>
                <th className="pb-3 font-medium">Costo</th>
                <th className="pb-3 font-medium">Precio</th>
                <th className="pb-3 font-medium">Margen</th>
                <th className="pb-3 font-medium">Valor stock</th>
                <th className="pb-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product) => {
                const stockStatus = getStockStatus(
                  product.stock,
                  product.low_stock_threshold
                );
                const margin =
                  product.cost_price > 0
                    ? ((1 - product.cost_price / product.price) * 100).toFixed(0)
                    : "—";

                return (
                  <tr key={product.id}>
                    <td className="py-3">
                      <div className="font-medium">{product.name}</div>
                      {!product.active && (
                        <span className="text-xs text-gray-400">Inactivo</span>
                      )}
                    </td>
                    <td className="py-3 font-mono text-xs text-gray-500">
                      {product.sku ?? "—"}
                    </td>
                    <td className="py-3 font-bold">{product.stock}</td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${stockStatus.color}`}
                      >
                        {stockStatus.label}
                      </span>
                    </td>
                    <td className="py-3">{formatPrice(product.cost_price)}</td>
                    <td className="py-3">{formatPrice(product.price)}</td>
                    <td className="py-3">{margin}%</td>
                    <td className="py-3">
                      {formatPrice(product.cost_price * product.stock)}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <StockAdjuster
                          productId={product.id}
                          currentStock={product.stock}
                          productName={product.name}
                        />
                        <Link
                          href={`/admin/inventario/${product.id}`}
                          className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                        >
                          Historial
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
