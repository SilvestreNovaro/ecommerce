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
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("pickup");
  const [shipAddress, setShipAddress] = useState("");
  const [shipCity, setShipCity] = useState("");
  const [shipProvince, setShipProvince] = useState("");
  const [shipZip, setShipZip] = useState("");
  const [shipNotes, setShipNotes] = useState("");
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
    if (submittedRef.current || loading) return;
    submittedRef.current = true;
    setLoading(true);
    setError("");

    const result = await createOrder({
      items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
      customerName: fullName,
      customerPhone: phone,
      fulfillment,
      shipAddress,
      shipCity,
      shipProvince,
      shipZip,
      shipNotes,
    });

    if (!result.success) {
      setError(result.error ?? "Error al procesar la orden.");
      setLoading(false);
      submittedRef.current = false;
      return;
    }

    clearCart();
    router.push(`/checkout/confirmacion?order=${result.orderId}`);
  }

  const inputCls =
    "mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black";

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Checkout</h1>

      <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-2">
          <h2 className="text-lg font-bold">Tus datos</h2>

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
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium">
              Teléfono (solo números)
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              required
              className={inputCls}
            />
          </div>

          <h2 className="text-lg font-bold">Entrega</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <FulfillmentCard
              active={fulfillment === "pickup"}
              onClick={() => setFulfillment("pickup")}
              title="🏠 Retiro"
              detail="Retirás tu pedido sin costo. Te avisamos por WhatsApp cuando esté listo."
            />
            <FulfillmentCard
              active={fulfillment === "delivery"}
              onClick={() => setFulfillment("delivery")}
              title="🚚 Envío a domicilio"
              detail="El costo de envío NO está incluido: se coordina por WhatsApp."
            />
          </div>

          {fulfillment === "delivery" && (
            <div className="space-y-4 rounded-lg border p-4">
              <div>
                <label htmlFor="address" className="block text-sm font-medium">
                  Dirección
                </label>
                <input
                  id="address"
                  type="text"
                  value={shipAddress}
                  onChange={(e) => setShipAddress(e.target.value)}
                  required
                  className={inputCls}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium">
                    Ciudad
                  </label>
                  <input id="city" type="text" value={shipCity} onChange={(e) => setShipCity(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="province" className="block text-sm font-medium">
                    Provincia
                  </label>
                  <input id="province" type="text" value={shipProvince} onChange={(e) => setShipProvince(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="zip" className="block text-sm font-medium">
                    CP
                  </label>
                  <input id="zip" type="text" value={shipZip} onChange={(e) => setShipZip(e.target.value)} className={inputCls} />
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="notes" className="block text-sm font-medium">
              Notas (opcional)
            </label>
            <textarea id="notes" value={shipNotes} onChange={(e) => setShipNotes(e.target.value)} rows={2} className={inputCls} />
          </div>

          <h2 className="text-lg font-bold">Pago</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border-2 border-black p-4">
              <p className="font-semibold">🏦 Transferencia bancaria</p>
              <p className="mt-1 text-xs text-gray-500">
                Al confirmar te mostramos los datos para transferir. El pedido entra en preparación
                cuando confirmamos el pago.
              </p>
            </div>
            <div className="rounded-lg border p-4 opacity-50">
              <p className="font-semibold">💳 Mercado Pago</p>
              <p className="mt-1 text-xs text-gray-500">Próximamente.</p>
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-black py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Procesando..." : `Confirmar pedido — ${formatPrice(total)}`}
          </button>
        </form>

        <div className="h-fit rounded-lg border p-6">
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
          <div className="mt-4 flex justify-between border-t pt-4 font-bold">
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

function FulfillmentCard({
  active,
  onClick,
  title,
  detail,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  detail: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border-2 p-4 text-left transition-colors ${
        active ? "border-black" : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-xs text-gray-500">{detail}</p>
    </button>
  );
}
