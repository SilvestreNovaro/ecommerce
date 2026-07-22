import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/shop/product-card";
import HeroCarousel from "@/components/shop/hero-carousel";
import { computePrices } from "@/lib/pricing";
import { getStoreSettings } from "@/lib/settings";
import { getBannerSlides } from "@/lib/banners";
import { getPetPhotos } from "@/lib/pet-gallery";
import PetGallery from "@/components/shop/pet-gallery";
import type { Product, Category } from "@/types";

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: products }, { data: categoriesData }, settings, heroSlides, petPhotos] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(8),
    supabase.from("categories").select("*").order("name"),
    getStoreSettings(),
    getBannerSlides("home"),
    getPetPhotos(6),
  ]);

  const categories = (categoriesData ?? []) as Category[];

  return (
    <>
      {/* Hero carrusel de banners (full viewport). Si no hay banners activos, nada. */}
      {heroSlides.length > 0 && <HeroCarousel slides={heroSlides} />}

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink">
          Bienvenido a <span className="text-brand">nalika</span> 🐾
        </h1>
        <p className="mt-4 text-lg text-ink/60">
          Todo lo que tu mejor amigo necesita, elegido con el mismo amor con el que lo cuidás.
        </p>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mt-10">
          <h2 className="text-center text-sm font-medium text-gray-500 uppercase tracking-wide">
            Categorías
          </h2>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {categories.filter((c) => !c.parent_id).map((cat) => (
              <Link
                key={cat.id}
                href={`/productos?category=${cat.slug}`}
                className="rounded-full border px-5 py-2 text-sm font-medium hover:bg-brand hover:text-white transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      <section className="mt-16">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Productos destacados</h2>
          <Link href="/productos" className="text-sm underline">
            Ver todos
          </Link>
        </div>

        {!products || products.length === 0 ? (
          <p className="mt-8 text-gray-500">Próximamente...</p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(products as Product[]).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                prices={computePrices(product, settings.transferPct, settings.transferEnabled)}
              />
            ))}
          </div>
        )}
      </section>
      </div>

      {/* Galería Mascotas (réplica de Suk Comunidad). Solo si hay fotos activas. */}
      <PetGallery photos={petPhotos} />
    </>
  );
}
