import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NalikaLogo } from "@/components/logo";
import { CartBadge } from "./cart-badge";
import { SearchBar } from "./search-bar";
import { MobileMenu } from "./mobile-menu";

export async function Header() {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    { data: categoriesData },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("categories").select("name, slug, parent_id").order("name"),
  ]);
  // Solo categorías raíz en la barra (las subcategorías viven en /productos).
  const categories = (categoriesData ?? []).filter((c) => !c.parent_id);

  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      {/* Alto FIJO: el hero de la home calcula su alto con --nav-h
          (72px mobile · 72+44px desktop con la barra de categorías). */}
      <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Nalika — inicio">
          <NalikaLogo size={38} />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          <Link href="/productos" className="text-sm font-medium hover:text-brand">
            Productos
          </Link>
          <Link href="/galeria" className="text-sm font-medium hover:text-brand">
            Galería Mascotas
          </Link>
          <SearchBar />
          <CartBadge />
          {user ? (
            <>
              <Link href="/cuenta" className="text-sm hover:text-brand">
                Mi cuenta
              </Link>
              <form action="/auth/signout" method="POST">
                <button type="submit" className="text-sm text-gray-500 hover:text-brand">
                  Salir
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="text-sm hover:text-brand">
              Ingresar
            </Link>
          )}
        </div>

        {/* Mobile nav */}
        <div className="flex items-center gap-1 md:hidden">
          <SearchBar />
          <MobileMenu isLoggedIn={!!user} categories={categories} />
        </div>
      </nav>

      {/* Barra de categorías (solo desktop) */}
      {categories.length > 0 && (
        <div className="hidden border-t border-sand bg-cream md:block">
          <div className="mx-auto flex h-[44px] max-w-7xl items-center gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/productos?category=${c.slug}`}
                className="shrink-0 rounded-full px-3 py-1 text-sm font-medium text-ink/70 transition-colors hover:bg-brand/10 hover:text-brand-dark"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
