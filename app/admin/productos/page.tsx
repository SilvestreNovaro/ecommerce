import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import type { Product } from "@/types";

export default async function AdminProductosPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  const products = (data ?? []) as Product[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Productos</h2>
        <Link
          href="/admin/productos/nuevo"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Nuevo producto
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="mt-8 text-gray-500">No hay productos todavía.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-gray-500">
              <tr>
                <th className="pb-3 font-medium">Nombre</th>
                <th className="pb-3 font-medium">Precio</th>
                <th className="pb-3 font-medium">Stock</th>
                <th className="pb-3 font-medium">Estado</th>
                <th className="pb-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="py-3 font-medium">{product.name}</td>
                  <td className="py-3">{formatPrice(product.price)}</td>
                  <td className="py-3">{product.stock}</td>
                  <td className="py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                        product.active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {product.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-3">
                      <Link
                        href={`/admin/productos/${product.id}`}
                        className="text-sm underline"
                      >
                        Editar
                      </Link>
                      <DeleteProductButton productId={product.id} />
                    </div>
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
