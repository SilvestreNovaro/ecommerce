import Link from "next/link";
import { redirect } from "next/navigation";
import { NalikaLogo } from "@/components/logo";
import { getAdminUser } from "@/lib/admin-auth";
import { AdminProvider } from "@/components/admin/admin-context";
import AdminNav from "@/components/admin/admin-nav";
import { signOutAdmin } from "./actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  return (
    <AdminProvider user={user}>
      <div className="min-h-screen bg-cloud md:flex">
        {/* Sidebar: sticky a la altura del viewport para que el bloque de
            usuario/cerrar sesión NO se vaya al fondo en páginas largas. */}
        <aside className="flex flex-col gap-4 border-b border-black/5 bg-white p-4 md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:overflow-y-auto md:border-b-0 md:border-r">
          <div className="flex flex-col gap-1">
            <NalikaLogo size={42} />
            <p className="text-xs font-medium uppercase tracking-wide text-ink/40">Backoffice</p>
          </div>

          <Link
            href="/"
            target="_blank"
            className="rounded-full border border-black/10 px-3 py-2 text-center text-sm font-medium text-ink/60 hover:bg-black/5"
          >
            ↗ Ver sitio
          </Link>

          <AdminNav />

          <div className="mt-auto border-t border-black/5 pt-3 text-sm">
            <p className="truncate font-medium text-ink">{user.email}</p>
            <p className="mb-2 capitalize text-ink/40">{user.role}</p>
            <form action={signOutAdmin}>
              <button
                type="submit"
                className="w-full rounded-full border border-black/10 px-3 py-2 font-medium text-ink/60 hover:bg-black/5"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </aside>

        <main className="mx-auto w-full max-w-5xl flex-1 p-4 md:p-8">{children}</main>
      </div>
    </AdminProvider>
  );
}
