"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/types";

// Agregado rápido desde la card (sin entrar al producto). Vive DENTRO de un
// <Link>, por eso frena la navegación con preventDefault/stopPropagation.
export function QuickAddButton({ product }: { product: Product }) {
  const { addItem, items } = useCart();
  const [added, setAdded] = useState(false);

  const inCart = items.find((i) => i.product.id === product.id)?.quantity ?? 0;
  const maxed = inCart >= product.stock;

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock === 0 || maxed) return;
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  if (product.stock === 0) {
    return (
      <span className="mt-3 block rounded-full border border-sand py-2 text-center text-xs font-medium text-ink/40">
        Agotado
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={maxed}
      className={`mt-3 w-full rounded-full py-2 text-xs font-semibold transition-colors ${
        added
          ? "bg-save text-white"
          : maxed
            ? "cursor-default border border-sand text-ink/40"
            : "bg-brand text-white hover:bg-brand-dark"
      }`}
    >
      {added ? "✓ Agregado" : maxed ? "No hay más unidades" : "Agregar al carrito"}
    </button>
  );
}
