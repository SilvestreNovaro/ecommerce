import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { QuickAddButton } from "@/components/shop/quick-add-button";
import type { ProductPrices } from "@/lib/pricing";
import type { Product } from "@/types";

// Card de producto con el modelo de precios SUK: doble precio SOLO si hay
// ahorro real (nada tachado ni verde si no hay descuento). Los precios vienen
// calculados server-side (computePrices) desde la página que la renderiza.
export function ProductCard({ product, prices }: { product: Product; prices?: ProductPrices }) {
  const hasPromo = prices?.hasPromo ?? false;
  const current = prices?.current ?? product.price;
  return (
    <Link
      href={`/productos/${product.slug}`}
      className="group block overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square bg-gray-100">
        {hasPromo && (
          <span className="absolute right-2 top-2 z-10 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
            Oferta
          </span>
        )}
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            Sin imagen
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium truncate">{product.name}</h3>
        <div className="mt-1">
          {hasPromo ? (
            <p className="flex items-baseline gap-2">
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(prices!.normal)}
              </span>
              <span className="text-lg font-bold">{formatPrice(current)}</span>
            </p>
          ) : (
            <p className="text-lg font-bold">{formatPrice(current)}</p>
          )}
          {prices?.hasTransferDiscount && (
            <p className="text-sm font-semibold text-save">
              Con transferencia: {formatPrice(prices.transfer!)}
            </p>
          )}
        </div>
        {/* Compra rápida sin entrar al producto (pedido de Joaco) */}
        <QuickAddButton product={product} />
      </div>
    </Link>
  );
}
