import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
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

  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (!data) notFound();

  const product = data as Product;

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
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="mt-4 text-3xl font-bold">
            {formatPrice(product.price)}
          </p>

          {product.stock > 0 ? (
            <p className="mt-2 text-sm text-green-600">
              {product.stock} en stock
            </p>
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
