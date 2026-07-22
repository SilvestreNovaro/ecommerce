import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Sugerencias del buscador: productos activos + categorías que matchean.
// Lectura pública vía anon client (RLS: solo productos activos).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = (searchParams.get("q") ?? "").trim().slice(0, 60);
  if (raw.length < 2) return NextResponse.json({ products: [], categories: [] });

  // Escapar comodines de ilike para que no se inyecten patrones.
  const q = raw.replace(/[%_]/g, "\\$&");

  const supabase = await createClient();
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("name, slug, image_url, price, promo_price")
      .eq("active", true)
      .ilike("name", `%${q}%`)
      .order("sort_order")
      .limit(6),
    supabase
      .from("categories")
      .select("name, slug")
      .ilike("name", `%${q}%`)
      .limit(3),
  ]);

  return NextResponse.json(
    { products: products ?? [], categories: categories ?? [] },
    { headers: { "Cache-Control": "public, max-age=30" } }
  );
}
