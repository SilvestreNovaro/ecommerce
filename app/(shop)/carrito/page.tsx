"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/utils";

export default function CarritoPage() {
  const { items, updateQuantity, removeItem, total, itemCount } = useCart();

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold">Carrito de compras</h1>
        <p className="mt-8 text-gray-500">Tu carrito está vacío.</p>
        <Link
          href="/productos"
          className="mt-4 inline-block text-sm underline"
        >
          Ver productos
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Carrito de compras</h1>

      <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {items.map(({ product, quantity }) => (
            <div
              key={product.id}
              className="flex gap-4 rounded-lg border p-4"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-gray-100">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-gray-400">
                    Sin img
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <Link
                    href={`/productos/${product.slug}`}
                    className="font-medium hover:underline"
                  >
                    {product.name}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {formatPrice(product.price)} c/u
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded border text-sm hover:bg-gray-50"
                  >
                    -
                  </button>
                  <span className="text-sm font-medium">{quantity}</span>
                  <button
                    onClick={() => {
                      if (quantity < product.stock) {
                        updateQuantity(product.id, quantity + 1);
                      }
                    }}
                    disabled={quantity >= product.stock}
                    className="flex h-8 w-8 items-center justify-center rounded border text-sm hover:bg-gray-50 disabled:opacity-30"
                  >
                    +
                  </button>
                  {quantity >= product.stock && (
                    <span className="text-xs text-red-500">Máx</span>
                  )}
                  <button
                    onClick={() => removeItem(product.id)}
                    className="ml-auto text-sm text-red-500 hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              <p className="shrink-0 font-bold">
                {formatPrice(product.price * quantity)}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border p-6 h-fit">
          <h2 className="text-lg font-bold">Resumen</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Productos ({itemCount})</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between">
              <span>Envío</span>
              <span className="text-green-600">Gratis</span>
            </div>
          </div>
          <div className="mt-4 border-t pt-4 flex justify-between font-bold">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          <Link
            href="/checkout"
            className="mt-6 block w-full rounded-md bg-black py-3 text-center text-sm font-medium text-white hover:bg-gray-800"
          >
            Ir al checkout
          </Link>
        </div>
      </div>
    </main>
  );
}
