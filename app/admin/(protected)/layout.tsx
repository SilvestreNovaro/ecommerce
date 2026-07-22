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
        {/* Sidebar */}
        <aside className="flex flex-col gap-4 border-b border-black/5 bg-white p-4 md:min-h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r">
          <div className="flex flex-col gap-0.5">
            <NalikaLogo size={32} />
            <p className="text-[10px] uppercase tracking-wide text-ink/40">Backoffice</p>
          </div>

          <Link
            href="/"
            target="_blank"
            className="rounded-full border border-black/10 px-3 py-1.5 text-center text-xs font-medium text-ink/60 hover:bg-black/5"
          >
            ↗ Ver sitio
          </Link>

          <AdminNav />

          <div className="mt-auto border-t border-black/5 pt-3 text-xs">
            <p className="truncate font-medium text-ink">{user.email}</p>
            <p className="mb-2 capitalize text-ink/40">{user.role}</p>
            <form action={signOutAdmin}>
              <button
                type="submit"
                className="w-full rounded-full border border-black/10 px-3 py-1.5 font-medium text-ink/60 hover:bg-black/5"
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
