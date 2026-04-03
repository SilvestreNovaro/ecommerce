import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CartBadge } from "./cart-badge";
import { SearchBar } from "./search-bar";
import { MobileMenu } from "./mobile-menu";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-bold">
          Tienda
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          <Link href="/productos" className="text-sm hover:underline">
            Productos
          </Link>
          <SearchBar />
          <CartBadge />
          {user ? (
            <>
              <Link href="/cuenta" className="text-sm hover:underline">
                Mi cuenta
              </Link>
              <form action="/auth/signout" method="POST">
                <button
                  type="submit"
                  className="text-sm text-gray-500 hover:underline"
                >
                  Salir
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="text-sm hover:underline">
              Ingresar
            </Link>
          )}
        </div>

        {/* Mobile nav */}
        <div className="flex items-center gap-1 md:hidden">
          <SearchBar />
          <MobileMenu isLoggedIn={!!user} />
        </div>
      </nav>
    </header>
  );
}
