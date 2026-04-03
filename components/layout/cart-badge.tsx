"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export function CartBadge() {
  const { itemCount } = useCart();

  return (
    <Link href="/carrito" className="relative text-sm hover:underline">
      Carrito
      {itemCount > 0 && (
        <span className="absolute -right-4 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs text-white">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
