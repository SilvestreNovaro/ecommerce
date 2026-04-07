"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/types";

export function AddToCartButton({ product }: { product: Product }) {
  const { addItem, items } = useCart();
  const [message, setMessage] = useState("");

  const currentInCart =
    items.find((i) => i.product.id === product.id)?.quantity ?? 0;
  const canAdd = currentInCart < product.stock;

  function handleAdd() {
    if (!canAdd) {
      setMessage(`Solo hay ${product.stock} en stock`);
      setTimeout(() => setMessage(""), 2000);
      return;
    }

    addItem(product);
    setMessage("Agregado!");
    setTimeout(() => setMessage(""), 2000);
  }

  return (
    <div>
      <button
        onClick={handleAdd}
        disabled={product.stock === 0}
        className="w-full rounded-md bg-black py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 md:w-auto md:px-8"
      >
        {message || (product.stock === 0 ? "Agotado" : "Agregar al carrito")}
      </button>
      {currentInCart > 0 && !message && (
        <p className="mt-1 text-xs text-gray-500">
          {currentInCart} en tu carrito
        </p>
      )}
    </div>
  );
}
