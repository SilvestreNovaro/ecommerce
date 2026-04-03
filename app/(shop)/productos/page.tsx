import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/shop/product-card";
import { ProductFilters } from "@/components/shop/product-filters";
import type { Product, Category } from "@/types";

export const metadata: Metadata = {
  title: "Productos",
  description: "Explorá nuestro catálogo completo de productos.",
};

type Props = {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
};

export default async function ProductosPage({ searchParams }: Props) {
  const { q, category, sort } = await searchParams;
  const supabase = await createClient();

  // Get categories
  const { data: categoriesData } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  const categories = (categoriesData ?? []) as Category[];

  // Build products query
  let query = supabase.from("products").select("*").eq("active", true);

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  if (category) {
    const cat = categories.find((c) => c.slug === category);
    if (cat) {
      query = query.eq("category_id", cat.id);
    }
  }

  if (sort === "price_asc") {
    query = query.order("price", { ascending: true });
  } else if (sort === "price_desc") {
    query = query.order("price", { ascending: false });
  } else if (sort === "name") {
    query = query.order("name", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: products } = await query;
  const items = (products ?? []) as Product[];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Productos</h1>

      <div className="mt-6">
        <ProductFilters
          categories={categories}
          currentQ={q}
          currentCategory={category}
          currentSort={sort}
          totalResults={items.length}
        />
      </div>

      {items.length === 0 ? (
        <p className="mt-12 text-center text-gray-500">
          No se encontraron productos.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
