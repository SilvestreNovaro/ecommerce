"use client";

import { useEffect, useState } from "react";
import type { CartItem } from "@/lib/cart-context";
import type { CartQuote } from "@/lib/quote";

// Hook cliente: pide la cotización real del carrito a /api/cart/quote
// (promos + descuento por transferencia, todo server-side). Mientras carga,
// las pantallas muestran los precios naive del contexto como fallback.
export function useCartQuote(items: CartItem[]): { quote: CartQuote | null; loading: boolean } {
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [loading, setLoading] = useState(false);

  // Clave estable: solo re-cotizar cuando cambian productos/cantidades.
  const key = items.map((i) => `${i.product.id}:${i.quantity}`).join("|");

  useEffect(() => {
    if (!key) {
      setQuote(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    fetch("/api/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: key.split("|").map((pair) => {
          const [productId, qty] = pair.split(":");
          return { productId, quantity: Number(qty) };
        }),
      }),
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && !controller.signal.aborted) setQuote(data as CartQuote);
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [key]);

  return { quote, loading };
}
