"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/types";

export function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <button
      onClick={handleAdd}
      disabled={product.stock === 0}
      className="w-full rounded-md bg-black py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 md:w-auto md:px-8"
    >
      {added ? "Agregado!" : "Agregar al carrito"}
    </button>
  );
}
