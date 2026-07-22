import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NalikaLogo } from "@/components/logo";
import { CartWidget } from "./cart-widget";
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
  // Solo categorías raíz en la navegación (las subcategorías viven en /productos).
  const categories = (categoriesData ?? []).filter((c) => !c.parent_id);

  return (
    <header className="sticky top-0 z-50 border-b border-sand bg-white">
      {/* Fila 1: logo + búsqueda + cuenta/carrito.
          Alto FIJO: el hero usa --nav-h (77px mobile · 121px desktop). */}
      <div className="mx-auto flex h-[76px] max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Nalika — inicio" className="shrink-0">
          <NalikaLogo size={44} />
        </Link>

        <div className="hidden flex-1 justify-center md:flex">
          <SearchBar />
        </div>

        {/* Acciones desktop */}
        <div className="hidden shrink-0 items-center gap-5 md:flex">
          {user ? (
            <>
              <Link href="/cuenta" className="text-sm font-medium text-ink/70 hover:text-brand">
                Mi cuenta
              </Link>
              <form action="/auth/signout" method="POST">
                <button type="submit" className="text-sm text-ink/40 hover:text-brand">
                  Salir
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="text-sm font-medium text-ink/70 hover:text-brand">
              Ingresar
            </Link>
          )}
          <CartWidget />
        </div>

        {/* Acciones mobile */}
        <div className="ml-auto flex items-center gap-1 md:hidden">
          <SearchBar />
          <CartWidget />
          <MobileMenu isLoggedIn={!!user} categories={categories} />
        </div>
      </div>

      {/* Fila 2 (solo desktop): navegación por categorías — mismo blanco,
          separada apenas por un borde sutil para leerse como UNA pieza. */}
      <nav className="hidden border-t border-sand/60 md:block">
        <div className="mx-auto flex h-[44px] max-w-7xl items-center gap-6 overflow-x-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/productos"
            className="shrink-0 text-sm font-semibold text-ink hover:text-brand"
          >
            Todos los productos
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/productos?category=${c.slug}`}
              className="shrink-0 text-sm font-medium text-ink/60 transition-colors hover:text-brand"
            >
              {c.name}
            </Link>
          ))}
          <Link
            href="/galeria"
            className="ml-auto shrink-0 text-sm font-medium text-ink/60 hover:text-brand"
          >
            Galería Mascotas 🐾
          </Link>
        </div>
      </nav>
    </header>
  );
}
