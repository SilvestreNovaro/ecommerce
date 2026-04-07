"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/utils";
import { createOrder } from "./actions";

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const submittedRef = useRef(false);

  if (items.length === 0 && !loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold">Checkout</h1>
        <p className="mt-8 text-gray-500">No hay productos en tu carrito.</p>
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Prevent double submission
    if (submittedRef.current || loading) return;
    submittedRef.current = true;

    setLoading(true);
    setError("");

    const address = `${fullName}\n${phone}\n${shippingAddress}`;

    const result = await createOrder(
      items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
      address
    );

    if (!result.success) {
      setError(result.error ?? "Error al procesar la orden.");
      setLoading(false);
      submittedRef.current = false;
      return;
    }

    // Send confirmation email (fire and forget)
    fetch("/api/emails/order-confirmation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: result.orderId }),
    }).catch(() => {});

    clearCart();
    router.push(`/checkout/confirmacion?order=${result.orderId}`);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Checkout</h1>

      <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold">Datos de envío</h2>

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium">
              Nombre completo
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium">
              Teléfono
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium">
              Dirección de envío
            </label>
            <textarea
              id="address"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              required
              rows={3}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-black py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading
              ? "Procesando..."
              : `Confirmar orden — ${formatPrice(total)}`}
          </button>
        </form>

        <div className="rounded-lg border p-6 h-fit">
          <h2 className="text-lg font-bold">Resumen del pedido</h2>
          <div className="mt-4 space-y-3">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex justify-between text-sm">
                <span>
                  {product.name} x{quantity}
                </span>
                <span>{formatPrice(product.price * quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t pt-4 flex justify-between font-bold">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          <p className="mt-3 text-xs text-gray-400">
            El total final se calcula en el servidor con los precios actuales.
          </p>
        </div>
      </div>
    </main>
  );
}
