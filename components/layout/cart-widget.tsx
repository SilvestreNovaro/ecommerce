"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart-context";
import { useCartQuote } from "@/lib/use-cart-quote";
import { formatPrice } from "@/lib/utils";

// CartWidget (patrón SUK): mini-cart al HOVER + drawer lateral al CLICK.
// El drawer va por portal a document.body (un backdrop-blur en el header
// crearía containing block y confinaría el fixed — lección aprendida en SUK).
export function CartWidget() {
  const { items, itemCount, total, updateQuantity, removeItem } = useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { quote } = useCartQuote(items);

  useEffect(() => setMounted(true), []);

  // Bloquear scroll del body con el drawer abierto.
  useEffect(() => {
    if (drawerOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [drawerOpen]);

  const displayTotal = quote ? quote.total : total;
  const saving = quote?.saving ?? 0;

  return (
    <>
      <div className="group relative">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5"
          aria-label={`Carrito (${itemCount})`}
        >
          <svg className="h-5 w-5 text-ink" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>
          {itemCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">
              {itemCount}
            </span>
          )}
        </button>

        {/* Mini-cart al hover (solo desktop) */}
        <div className="invisible absolute right-0 top-full z-50 hidden w-80 pt-2 opacity-0 transition-all group-hover:visible group-hover:opacity-100 md:block">
          <div className="rounded-2xl border border-sand bg-white p-4 shadow-xl">
            {items.length === 0 ? (
              <p className="py-4 text-center text-sm text-ink/50">Tu carrito está vacío 🐾</p>
            ) : (
              <>
                <ul className="max-h-64 space-y-3 overflow-y-auto">
                  {items.slice(0, 4).map(({ product, quantity }) => (
                    <li key={product.id} className="flex items-center gap-3">
                      <Thumb url={product.image_url} name={product.name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-ink">{product.name}</p>
                        <p className="text-xs text-ink/50">
                          ×{quantity} · {formatPrice(product.price * quantity)}
                        </p>
                      </div>
                    </li>
                  ))}
                  {items.length > 4 && (
                    <li className="text-center text-xs text-ink/40">+{items.length - 4} más…</li>
                  )}
                </ul>
                <div className="mt-3 flex justify-between border-t border-sand pt-3 text-sm font-semibold text-ink">
                  <span>Total</span>
                  <span>{formatPrice(displayTotal)}</span>
                </div>
                {saving > 0 && (
                  <p className="mt-0.5 text-right text-xs font-semibold text-save">
                    Ahorrás {formatPrice(saving)}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="mt-3 w-full rounded-full bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                >
                  Ver carrito
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Drawer lateral por portal */}
      {mounted &&
        drawerOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100]">
            <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
            <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-sand px-5 py-4">
                <h2 className="font-display text-lg font-bold text-ink">Tu carrito ({itemCount})</h2>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5"
                  aria-label="Cerrar carrito"
                >
                  ✕
                </button>
              </div>

              {items.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 text-ink/50">
                  <span className="text-4xl">🐾</span>
                  <p className="text-sm">Tu carrito está vacío</p>
                  <Link
                    href="/productos"
                    onClick={() => setDrawerOpen(false)}
                    className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                  >
                    Ver productos
                  </Link>
                </div>
              ) : (
                <>
                  <ul className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                    {items.map(({ product, quantity }) => (
                      <li key={product.id} className="flex gap-3">
                        <Thumb url={product.image_url} name={product.name} size={64} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">{product.name}</p>
                          <p className="text-sm text-ink/60">{formatPrice(product.price)}</p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <QtyBtn label="−" onClick={() => updateQuantity(product.id, quantity - 1)} />
                            <span className="w-6 text-center text-sm">{quantity}</span>
                            <QtyBtn
                              label="+"
                              onClick={() => updateQuantity(product.id, Math.min(quantity + 1, product.stock))}
                            />
                            <button
                              type="button"
                              onClick={() => removeItem(product.id)}
                              className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-red-50 hover:text-red-600"
                              aria-label={`Eliminar ${product.name} del carrito`}
                              title="Eliminar"
                            >
                              <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="border-t border-sand px-5 py-4 text-sm">
                    {quote && quote.promoDiscount > 0 && (
                      <Row label="Descuento promociones" value={`-${formatPrice(quote.promoDiscount)}`} accent />
                    )}
                    {quote && quote.transferDiscount > 0 && (
                      <Row
                        label={`Descuento transferencia (${quote.transferPct}%)`}
                        value={`-${formatPrice(quote.transferDiscount)}`}
                        accent
                      />
                    )}
                    <div className="flex justify-between py-1 text-base font-bold text-ink">
                      <span>Total</span>
                      <span>{formatPrice(displayTotal)}</span>
                    </div>
                    {saving > 0 && (
                      <p className="text-right text-xs font-semibold text-save">
                        Ahorrás {formatPrice(saving)} 🎉
                      </p>
                    )}
                    <div className="mt-3 grid gap-2">
                      <Link
                        href="/checkout"
                        onClick={() => setDrawerOpen(false)}
                        className="rounded-full bg-brand py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-dark"
                      >
                        Finalizar compra
                      </Link>
                      <Link
                        href="/carrito"
                        onClick={() => setDrawerOpen(false)}
                        className="rounded-full border border-sand py-2.5 text-center text-sm font-medium text-ink hover:bg-cream"
                      >
                        Ver carrito completo
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </aside>
          </div>,
          document.body
        )}
    </>
  );
}

function Thumb({ url, name, size = 48 }: { url: string | null; name: string; size?: number }) {
  return url ? (
    <Image
      src={url}
      alt={name}
      width={size}
      height={size}
      className="shrink-0 rounded-lg border border-sand object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="flex shrink-0 items-center justify-center rounded-lg border border-dashed border-sand text-lg"
      style={{ width: size, height: size }}
    >
      🐾
    </div>
  );
}

function QtyBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-6 w-6 items-center justify-center rounded-full border border-sand text-sm text-ink hover:bg-cream"
    >
      {label}
    </button>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`flex justify-between py-0.5 ${accent ? "text-save" : "text-ink/60"}`}>
      <span>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
