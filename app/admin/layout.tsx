import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center gap-6 border-b pb-4">
        <h1 className="text-xl font-bold">Admin</h1>
        <nav className="flex gap-4 text-sm">
          <Link href="/admin" className="hover:underline">
            Dashboard
          </Link>
          <Link href="/admin/productos" className="hover:underline">
            Productos
          </Link>
          <Link href="/admin/ordenes" className="hover:underline">
            Órdenes
          </Link>
          <Link href="/admin/clientes" className="hover:underline">
            Clientes
          </Link>
          <Link href="/admin/inventario" className="hover:underline">
            Inventario
          </Link>
          <Link href="/admin/categorias" className="hover:underline">
            Categorías
          </Link>
        </nav>
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}
