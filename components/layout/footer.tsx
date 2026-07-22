import Link from "next/link";
import { NalikaLogo } from "@/components/logo";
import { whatsappLink } from "@/lib/bank";

// Footer oscuro (patrón SUK) con el logo en versión clara.
export function Footer() {
  return (
    <footer className="bg-ink py-12 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Mobile: logo y contacto a lo ancho, links en 2 columnas. Desktop: 4 columnas. */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <NalikaLogo size={42} light />
            <p className="mt-3 text-sm text-white/50">
              Todo para tu mascota, con amor 🐾
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/90">Tienda</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/50">
              <li>
                <Link href="/productos" className="hover:text-brand-light">
                  Productos
                </Link>
              </li>
              <li>
                <Link href="/galeria" className="hover:text-brand-light">
                  Galería Mascotas
                </Link>
              </li>
              <li>
                <Link href="/carrito" className="hover:text-brand-light">
                  Carrito
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/90">Mi cuenta</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/50">
              <li>
                <Link href="/login" className="hover:text-brand-light">
                  Iniciar sesión
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-brand-light">
                  Crear cuenta
                </Link>
              </li>
              <li>
                <Link href="/cuenta" className="hover:text-brand-light">
                  Mis pedidos
                </Link>
              </li>
            </ul>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <h3 className="text-sm font-semibold text-white/90">Contacto</h3>
            <p className="mt-3 text-sm text-white/50">
              ¿Dudas con tu pedido o con un producto?
            </p>
            <a
              href={whatsappLink("Hola Nalika! Tengo una consulta 🐾")}
              target="_blank"
              className="mt-3 inline-block rounded-full bg-save px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Escribinos por WhatsApp
            </a>
          </div>
        </div>
        <div className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-white/40">
          &copy; {new Date().getFullYear()} nalika · Todos los derechos reservados
        </div>
      </div>
    </footer>
  );
}
