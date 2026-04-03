import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-white py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <h3 className="text-sm font-bold">Tienda</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-500">
              <li>
                <Link href="/productos" className="hover:underline">
                  Productos
                </Link>
              </li>
              <li>
                <Link href="/carrito" className="hover:underline">
                  Carrito
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold">Cuenta</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-500">
              <li>
                <Link href="/login" className="hover:underline">
                  Iniciar sesión
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:underline">
                  Crear cuenta
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold">Contacto</h3>
            <p className="mt-3 text-sm text-gray-500">
              ¿Tenés alguna consulta? Escribinos a{" "}
              <a
                href="mailto:info@tienda.com"
                className="underline"
              >
                info@tienda.com
              </a>
            </p>
          </div>
        </div>
        <div className="mt-8 border-t pt-6 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} Tienda. Todos los derechos
          reservados.
        </div>
      </div>
    </footer>
  );
}
