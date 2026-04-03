import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-bold">
          Tienda
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/productos" className="text-sm hover:underline">
            Productos
          </Link>
          <Link href="/carrito" className="text-sm hover:underline">
            Carrito
          </Link>
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
      </nav>
    </header>
  );
}
