import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/shop/product-card";
import type { Product, Category } from "@/types";

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: products }, { data: categoriesData }] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase.from("categories").select("*").order("name"),
  ]);

  const categories = (categoriesData ?? []) as Category[];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Bienvenido a nuestra tienda
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Descubre los mejores productos al mejor precio.
        </p>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mt-10">
          <h2 className="text-center text-sm font-medium text-gray-500 uppercase tracking-wide">
            Categorías
          </h2>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/productos?category=${cat.slug}`}
                className="rounded-full border px-5 py-2 text-sm font-medium hover:bg-black hover:text-white transition-colors"
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
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
