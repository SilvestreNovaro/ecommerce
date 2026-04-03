import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();

  const [{ count: productCount }, { count: orderCount }, { count: userCount }] =
    await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
    ]);

  const stats = [
    { label: "Productos", value: productCount ?? 0 },
    { label: "Órdenes", value: orderCount ?? 0 },
    { label: "Usuarios", value: userCount ?? 0 },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border p-6">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="mt-1 text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
