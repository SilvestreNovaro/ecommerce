import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { ReportPeriodSelector } from "@/components/admin/report-period-selector";
import { ExportReportButton } from "@/components/admin/export-report-button";

type Props = {
  searchParams: Promise<{ period?: string }>;
};

function getDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export default async function ReportesPage({ searchParams }: Props) {
  const { period } = await searchParams;
  const supabase = await createClient();

  // Determine date range
  const days = period === "7" ? 7 : period === "365" ? 365 : period === "1" ? 1 : 30;
  const periodLabel =
    days === 1 ? "Hoy" : days === 7 ? "7 días" : days === 365 ? "12 meses" : "30 días";
  const startDate = getDaysAgo(days);
  const prevStartDate = getDaysAgo(days * 2);

  // Current period orders
  const { data: currentOrders } = await supabase
    .from("orders")
    .select("id, total, status, created_at")
    .gte("created_at", startDate)
    .neq("status", "cancelled");

  // Previous period orders (for comparison)
  const { data: prevOrders } = await supabase
    .from("orders")
    .select("total, status")
    .gte("created_at", prevStartDate)
    .lt("created_at", startDate)
    .neq("status", "cancelled");

  const currentRevenue = (currentOrders ?? []).reduce((s, o) => s + o.total, 0);
  const currentCount = (currentOrders ?? []).length;
  const prevRevenue = (prevOrders ?? []).reduce((s, o) => s + o.total, 0);
  const prevCount = (prevOrders ?? []).length;

  const revenueChange =
    prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;
  const countChange =
    prevCount > 0 ? ((currentCount - prevCount) / prevCount) * 100 : 0;
  const avgTicket = currentCount > 0 ? currentRevenue / currentCount : 0;
  const prevAvgTicket = prevCount > 0 ? prevRevenue / prevCount : 0;
  const ticketChange =
    prevAvgTicket > 0 ? ((avgTicket - prevAvgTicket) / prevAvgTicket) * 100 : 0;

  // Order items with products and categories for the period
  const orderIds = (currentOrders ?? []).map((o) => o.id);

  const { data: orderItems } = orderIds.length > 0
    ? await supabase
        .from("order_items")
        .select("quantity, unit_price, products(id, name, category_id, categories(name))")
        .in("order_id", orderIds)
    : { data: [] };

  // Sales by category
  const categoryStats = new Map<string, { name: string; revenue: number; units: number }>();
  for (const item of orderItems ?? []) {
    const product = Array.isArray(item.products) ? item.products[0] : item.products;
    if (!product) continue;
    const cat = Array.isArray(product.categories)
      ? product.categories[0]
      : product.categories;
    const catName = (cat as { name: string } | null)?.name ?? "Sin categoría";
    const existing = categoryStats.get(catName) ?? { name: catName, revenue: 0, units: 0 };
    existing.revenue += item.unit_price * item.quantity;
    existing.units += item.quantity;
    categoryStats.set(catName, existing);
  }
  const categorySales = [...categoryStats.values()].sort(
    (a, b) => b.revenue - a.revenue
  );

  // Top products by revenue
  const productStats = new Map<
    string,
    { name: string; revenue: number; units: number }
  >();
  for (const item of orderItems ?? []) {
    const product = Array.isArray(item.products) ? item.products[0] : item.products;
    if (!product) continue;
    const name = (product as { name: string }).name;
    const pid = (product as { id: string }).id;
    const existing = productStats.get(pid) ?? { name, revenue: 0, units: 0 };
    existing.revenue += item.unit_price * item.quantity;
    existing.units += item.quantity;
    productStats.set(pid, existing);
  }
  const topByRevenue = [...productStats.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
  const topByUnits = [...productStats.values()]
    .sort((a, b) => b.units - a.units)
    .slice(0, 10);

  // Daily sales trend (last N days)
  const dailyMap = new Map<string, { revenue: number; orders: number }>();
  for (let i = 0; i < Math.min(days, 30); i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dailyMap.set(key, { revenue: 0, orders: 0 });
  }
  for (const order of currentOrders ?? []) {
    const key = order.created_at.slice(0, 10);
    const existing = dailyMap.get(key);
    if (existing) {
      existing.revenue += order.total;
      existing.orders += 1;
    }
  }
  const dailyTrend = [...dailyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));

  const maxDailyRevenue = Math.max(...dailyTrend.map((d) => d.revenue), 1);

  // Export data
  const exportData = {
    period: periodLabel,
    revenue: currentRevenue,
    orders: currentCount,
    avgTicket: Math.round(avgTicket),
    categorySales,
    topByRevenue,
    dailyTrend,
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Reportes</h2>
        <ExportReportButton data={exportData} />
      </div>

      {/* Period selector */}
      <div className="mt-4">
        <ReportPeriodSelector current={String(days)} />
      </div>

      {/* Summary with comparison */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500">Ingresos ({periodLabel})</p>
          <p className="mt-1 text-2xl font-bold">{formatPrice(currentRevenue)}</p>
          {prevRevenue > 0 && (
            <p
              className={`mt-1 text-xs font-medium ${revenueChange >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {revenueChange >= 0 ? "+" : ""}
              {revenueChange.toFixed(1)}% vs período anterior
            </p>
          )}
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500">Órdenes ({periodLabel})</p>
          <p className="mt-1 text-2xl font-bold">{currentCount}</p>
          {prevCount > 0 && (
            <p
              className={`mt-1 text-xs font-medium ${countChange >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {countChange >= 0 ? "+" : ""}
              {countChange.toFixed(1)}% vs período anterior
            </p>
          )}
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500">Ticket promedio</p>
          <p className="mt-1 text-2xl font-bold">{formatPrice(Math.round(avgTicket))}</p>
          {prevAvgTicket > 0 && (
            <p
              className={`mt-1 text-xs font-medium ${ticketChange >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {ticketChange >= 0 ? "+" : ""}
              {ticketChange.toFixed(1)}% vs período anterior
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Daily trend chart (simple bar) */}
        <div className="rounded-lg border bg-white p-4">
          <h3 className="font-bold">Tendencia de ventas</h3>
          {dailyTrend.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">Sin datos.</p>
          ) : (
            <div className="mt-4 space-y-1">
              {dailyTrend.map((day) => (
                <div key={day.date} className="flex items-center gap-2 text-xs">
                  <span className="w-10 shrink-0 text-gray-500">
                    {formatDate(day.date)}
                  </span>
                  <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                    <div
                      className="h-full bg-black rounded"
                      style={{
                        width: `${(day.revenue / maxDailyRevenue) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-right font-medium">
                    {formatPrice(day.revenue)}
                  </span>
                  <span className="w-8 shrink-0 text-right text-gray-400">
                    {day.orders}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sales by category */}
        <div className="rounded-lg border bg-white p-4">
          <h3 className="font-bold">Ventas por categoría</h3>
          {categorySales.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">Sin datos.</p>
          ) : (
            <div className="mt-4">
              <div className="space-y-3">
                {categorySales.map((cat) => {
                  const pct =
                    currentRevenue > 0
                      ? ((cat.revenue / currentRevenue) * 100).toFixed(1)
                      : "0";
                  return (
                    <div key={cat.name}>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{cat.name}</span>
                        <span>
                          {formatPrice(cat.revenue)}{" "}
                          <span className="text-gray-400">({pct}%)</span>
                        </span>
                      </div>
                      <div className="mt-1 h-2 bg-gray-100 rounded overflow-hidden">
                        <div
                          className="h-full bg-black rounded"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {cat.units} unidades vendidas
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top products */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-4">
          <h3 className="font-bold">Top productos por ingreso</h3>
          {topByRevenue.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">Sin datos.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b text-gray-500">
                  <tr>
                    <th className="pb-2 font-medium">#</th>
                    <th className="pb-2 font-medium">Producto</th>
                    <th className="pb-2 font-medium text-right">Ingresos</th>
                    <th className="pb-2 font-medium text-right">Uds</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {topByRevenue.map((p, i) => (
                    <tr key={i}>
                      <td className="py-2 text-gray-400">{i + 1}</td>
                      <td className="py-2 font-medium truncate max-w-[200px]">
                        {p.name}
                      </td>
                      <td className="py-2 text-right">
                        {formatPrice(p.revenue)}
                      </td>
                      <td className="py-2 text-right text-gray-500">
                        {p.units}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h3 className="font-bold">Top productos por unidades</h3>
          {topByUnits.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">Sin datos.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b text-gray-500">
                  <tr>
                    <th className="pb-2 font-medium">#</th>
                    <th className="pb-2 font-medium">Producto</th>
                    <th className="pb-2 font-medium text-right">Uds</th>
                    <th className="pb-2 font-medium text-right">Ingresos</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {topByUnits.map((p, i) => (
                    <tr key={i}>
                      <td className="py-2 text-gray-400">{i + 1}</td>
                      <td className="py-2 font-medium truncate max-w-[200px]">
                        {p.name}
                      </td>
                      <td className="py-2 text-right font-medium">
                        {p.units}
                      </td>
                      <td className="py-2 text-right text-gray-500">
                        {formatPrice(p.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
