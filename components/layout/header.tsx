import Link from "next/link";

export function Header() {
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
          <Link href="/login" className="text-sm hover:underline">
            Ingresar
          </Link>
        </div>
      </nav>
    </header>
  );
}
