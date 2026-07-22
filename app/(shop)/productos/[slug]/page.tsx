import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { computePrices } from "@/lib/pricing";
import { getStoreSettings } from "@/lib/settings";
import { AddToCartButton } from "@/components/shop/add-to-cart-button";
import type { Product } from "@/types";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("name, description, image_url")
    .eq("slug", slug)
    .single();

  if (!data) return { title: "Producto no encontrado" };

  return {
    title: data.name,
    description: data.description || `Comprá ${data.name} en nuestra tienda.`,
    openGraph: {
      title: data.name,
      description: data.description || `Comprá ${data.name} en nuestra tienda.`,
      images: data.image_url ? [data.image_url] : [],
    },
  };
}

export default async function ProductoDetallePage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const [{ data }, settings] = await Promise.all([
    supabase.from("products").select("*").eq("slug", slug).eq("active", true).single(),
    getStoreSettings(),
  ]);

  if (!data) notFound();

  const product = data as Product;
  const prices = computePrices(product, settings.transferPct, settings.transferEnabled);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              Sin imagen
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{product.name}</h1>
            {prices.hasPromo && (
              <span className="rounded-full bg-brand px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
                Oferta -{prices.promoPct}%
              </span>
            )}
          </div>

          {/* Doble precio SOLO si hay ahorro real (patrón SUK) */}
          <div className="mt-4">
            {prices.hasPromo ? (
              <p className="flex items-baseline gap-3">
                <span className="text-xl text-gray-400 line-through">
                  {formatPrice(prices.normal)}
                </span>
                <span className="text-3xl font-bold">{formatPrice(prices.current)}</span>
              </p>
            ) : (
              <p className="text-3xl font-bold">{formatPrice(prices.current)}</p>
            )}
            {prices.hasTransferDiscount && (
              <p className="mt-1 text-lg font-semibold text-save">
                Con transferencia: {formatPrice(prices.transfer!)}
              </p>
            )}
          </div>

          {/* Sin cantidades de stock en el front (pedido de Joaco): solo disponibilidad. */}
          {product.stock > 0 ? (
            <p className="mt-2 text-sm font-medium text-save">✓ Disponible</p>
          ) : (
            <p className="mt-2 text-sm text-red-500">Agotado</p>
          )}

          <p className="mt-6 text-gray-600 leading-relaxed">
            {product.description}
          </p>

          {product.stock > 0 && (
            <div className="mt-8">
              <AddToCartButton product={product} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
