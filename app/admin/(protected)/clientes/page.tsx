import { createAdminClient } from "@/lib/supabase/admin";
import { requireSection } from "@/lib/admin-auth";
import ClientsAdminList, { type AdminClient } from "@/components/admin/clients-admin-list";

export const dynamic = "force-dynamic";

export default async function AdminClientesPage() {
  await requireSection("clientes");
  const admin = createAdminClient();

  const [{ data: profiles, error }, { data: orders }, { data: adminRows }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, email, full_name, phone, created_at")
      .order("created_at", { ascending: false })
      .limit(1000),
    admin.from("orders").select("user_id, total, logistic_status, created_at"),
    admin.from("admin_users").select("id"),
  ]);
  if (error) return <p className="text-sm text-red-600">Error cargando clientes: {error.message}</p>;

  // Excluir usuarios del panel (admin/operador): tienen profile pero no son clientes.
  const adminIds = new Set((adminRows ?? []).map((a) => a.id));
  const realProfiles = (profiles ?? []).filter((p) => !adminIds.has(p.id));

  // Agregar pedidos por cliente (los cancelados no suman al total gastado).
  const stats = new Map<string, { count: number; total: number; last: string | null }>();
  for (const o of orders ?? []) {
    if (!o.user_id) continue;
    const s = stats.get(o.user_id) || { count: 0, total: 0, last: null };
    s.count += 1;
    if (o.logistic_status !== "cancelled") s.total += Number(o.total) || 0;
    if (!s.last || o.created_at > s.last) s.last = o.created_at;
    stats.set(o.user_id, s);
  }

  const clients: AdminClient[] = realProfiles.map((p) => {
    const s = stats.get(p.id);
    return {
      id: p.id,
      name: p.full_name,
      email: p.email,
      phone: p.phone,
      orderCount: s?.count ?? 0,
      totalSpent: s?.total ?? 0,
      lastOrderAt: s?.last ?? null,
      createdAt: p.created_at,
    };
  });

  const conPedidos = clients.filter((c) => c.orderCount > 0).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold text-ink">Clientes</h1>
        <p className="text-sm text-ink/50">
          {clients.length} {clients.length === 1 ? "cliente" : "clientes"}
          {conPedidos > 0 ? ` · ${conPedidos} con pedidos` : ""}
        </p>
      </div>
      <ClientsAdminList clients={clients} />
    </div>
  );
}
