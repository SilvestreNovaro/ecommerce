"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export function MobileMenu({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const { itemCount } = useCart();

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-gray-100"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
      >
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          {open ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          )}
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full border-b bg-white shadow-lg">
          <div className="flex flex-col px-4 py-4 space-y-3">
            <Link
              href="/productos"
              onClick={() => setOpen(false)}
              className="text-sm py-2 hover:underline"
            >
              Productos
            </Link>
            <Link
              href="/carrito"
              onClick={() => setOpen(false)}
              className="text-sm py-2 hover:underline"
            >
              Carrito{itemCount > 0 && ` (${itemCount})`}
            </Link>
            {isLoggedIn ? (
              <>
                <Link
                  href="/cuenta"
                  onClick={() => setOpen(false)}
                  className="text-sm py-2 hover:underline"
                >
                  Mi cuenta
                </Link>
                <form action="/auth/signout" method="POST">
                  <button
                    type="submit"
                    className="text-sm py-2 text-gray-500 hover:underline"
                  >
                    Salir
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="text-sm py-2 hover:underline"
              >
                Ingresar
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
