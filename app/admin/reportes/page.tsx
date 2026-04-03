import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { ReportPeriodSelector } from "@/components/admin/report-period-selector";
import { ExportReportButton } from "@/components/admin/export-report-button";
import { SalesChart } from "@/components/admin/sales-chart";
import { CategoryChart } from "@/components/admin/category-chart";

type Props = {
  searchParams: Promise<{ period?: string }>;
};

function getDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export default async function ReportesPage({ searchParams }: Props) {
  const { period } = await searchParams;
  const supabase = await createClient();

  // Determine date range
  const days =
    period === "7" ? 7 : period === "365" ? 365 : period === "1" ? 1 : 30;
  const periodLabel =
    days === 1
      ? "Hoy"
      : days === 7
        ? "7 días"
        : days === 365
          ? "12 meses"
          : "30 días";
  const startDate = getDaysAgo(days);
  const prevStartDate = getDaysAgo(days * 2);

  // Current & previous period orders
  const [{ data: currentOrders }, { data: prevOrders }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, total, status, created_at")
      .gte("created_at", startDate)
      .neq("status", "cancelled"),
    supabase
      .from("orders")
      .select("id, total, status, created_at")
      .gte("created_at", prevStartDate)
      .lt("created_at", startDate)
      .neq("status", "cancelled"),
  ]);

  const currentRevenue = (currentOrders ?? []).reduce(
    (s, o) => s + o.total,
    0
  );
  const currentCount = (currentOrders ?? []).length;
  const prevRevenue = (prevOrders ?? []).reduce((s, o) => s + o.total, 0);
  const prevCount = (prevOrders ?? []).length;

  const revenueChange =
    prevRevenue > 0
      ? ((currentRevenue - prevRevenue) / prevRevenue) * 100
      : 0;
  const countChange =
    prevCount > 0 ? ((currentCount - prevCount) / prevCount) * 100 : 0;
  const avgTicket = currentCount > 0 ? currentRevenue / currentCount : 0;
  const prevAvgTicket = prevCount > 0 ? prevRevenue / prevCount : 0;
  const ticketChange =
    prevAvgTicket > 0
      ? ((avgTicket - prevAvgTicket) / prevAvgTicket) * 100
      : 0;

  // Order items for the period
  const orderIds = (currentOrders ?? []).map((o) => o.id);
  const { data: orderItems } =
    orderIds.length > 0
      ? await supabase
          .from("order_items")
          .select(
            "quantity, unit_price, products(id, name, category_id, categories(name))"
          )
          .in("order_id", orderIds)
      : { data: [] };

  // Sales by category
  const categoryStats = new Map<
    string,
    { name: string; revenue: number; units: number }
  >();
  for (const item of orderItems ?? []) {
    const product = Array.isArray(item.products)
      ? item.products[0]
      : item.products;
    if (!product) continue;
    const cat = Array.isArray(product.categories)
      ? product.categories[0]
      : product.categories;
    const catName =
      (cat as { name: string } | null)?.name ?? "Sin categoría";
    const existing = categoryStats.get(catName) ?? {
      name: catName,
      revenue: 0,
      units: 0,
    };
    existing.revenue += item.unit_price * item.quantity;
    existing.units += item.quantity;
    categoryStats.set(catName, existing);
  }
  const categorySales = [...categoryStats.values()].sort(
    (a, b) => b.revenue - a.revenue
  );

  // Top products
  const productStats = new Map<
    string,
    { name: string; revenue: number; units: number }
  >();
  for (const item of orderItems ?? []) {
    const product = Array.isArray(item.products)
      ? item.products[0]
      : item.products;
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

  // Build chart data — all days in period
  const chartData = [];
  const currentDailyMap = new Map<string, { revenue: number; orders: number }>();
  const prevDailyMap = new Map<string, number>();

  for (const order of currentOrders ?? []) {
    const key = order.created_at.slice(0, 10);
    const existing = currentDailyMap.get(key) ?? { revenue: 0, orders: 0 };
    existing.revenue += order.total;
    existing.orders += 1;
    currentDailyMap.set(key, existing);
  }

  for (const order of prevOrders ?? []) {
    const key = order.created_at.slice(0, 10);
    prevDailyMap.set(key, (prevDailyMap.get(key) ?? 0) + order.total);
  }

  // Create entries for each day/point
  const prevDailyArray = [...prevDailyMap.entries()].sort(([a], [b]) =>
    a.localeCompare(b)
  );

  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const key = d.toISOString().slice(0, 10);
    const current = currentDailyMap.get(key) ?? { revenue: 0, orders: 0 };
    const prevEntry = prevDailyArray[i];

    const label =
      days <= 7
        ? d.toLocaleDateString("es-AR", { weekday: "short", day: "numeric" })
        : days <= 30
          ? d.toLocaleDateString("es-AR", { day: "numeric", month: "short" })
          : d.toLocaleDateString("es-AR", { month: "short" });

    chartData.push({
      date: key,
      label,
      revenue: current.revenue,
      orders: current.orders,
      prevRevenue: prevEntry ? prevEntry[1] : 0,
    });
  }

  // For 365 days, aggregate by week to avoid too many points
  let displayChartData = chartData;
  if (days === 365) {
    const weeklyMap = new Map<
      string,
      { label: string; revenue: number; orders: number; prevRevenue: number }
    >();
    for (const point of chartData) {
      const d = new Date(point.date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      const existing = weeklyMap.get(key) ?? {
        label: weekStart.toLocaleDateString("es-AR", {
          day: "numeric",
          month: "short",
        }),
        revenue: 0,
        orders: 0,
        prevRevenue: 0,
      };
      existing.revenue += point.revenue;
      existing.orders += point.orders;
      existing.prevRevenue += point.prevRevenue;
      weeklyMap.set(key, existing);
    }
    displayChartData = [...weeklyMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, ...data }));
  }

  // Export data
  const exportData = {
    period: periodLabel,
    revenue: currentRevenue,
    orders: currentCount,
    avgTicket: Math.round(avgTicket),
    categorySales,
    topByRevenue,
    dailyTrend: chartData.filter((d) => d.revenue > 0),
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

      {/* Summary cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Ingresos
          </p>
          <p className="mt-2 text-3xl font-bold">
            {formatPrice(currentRevenue)}
          </p>
          {prevRevenue > 0 && (
            <p
              className={`mt-1 text-sm font-medium ${revenueChange >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {revenueChange >= 0 ? "+" : ""}
              {revenueChange.toFixed(1)}% vs período anterior
            </p>
          )}
        </div>
        <div className="rounded-lg border bg-white p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Órdenes
          </p>
          <p className="mt-2 text-3xl font-bold">{currentCount}</p>
          {prevCount > 0 && (
            <p
              className={`mt-1 text-sm font-medium ${countChange >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {countChange >= 0 ? "+" : ""}
              {countChange.toFixed(1)}% vs período anterior
            </p>
          )}
        </div>
        <div className="rounded-lg border bg-white p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Ticket promedio
          </p>
          <p className="mt-2 text-3xl font-bold">
            {formatPrice(Math.round(avgTicket))}
          </p>
          {prevAvgTicket > 0 && (
            <p
              className={`mt-1 text-sm font-medium ${ticketChange >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {ticketChange >= 0 ? "+" : ""}
              {ticketChange.toFixed(1)}% vs período anterior
            </p>
          )}
        </div>
      </div>

      {/* Main chart */}
      <div className="mt-8 rounded-lg border bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Tendencia de ventas</h3>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <div className="h-0.5 w-4 bg-black rounded" />
              <span>Actual</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-0.5 w-4 bg-gray-300 rounded border-dashed" />
              <span>Anterior</span>
            </div>
          </div>
        </div>
        <SalesChart
          data={displayChartData}
          showComparison={prevRevenue > 0}
        />
      </div>

      {/* Category + Top products */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Category donut */}
        <div className="rounded-lg border bg-white p-5">
          <h3 className="font-bold">Ventas por categoría</h3>
          <CategoryChart data={categorySales} />
          {categorySales.length > 0 && (
            <div className="mt-4 space-y-2">
              {categorySales.map((cat) => {
                const pct =
                  currentRevenue > 0
                    ? ((cat.revenue / currentRevenue) * 100).toFixed(1)
                    : "0";
                return (
                  <div
                    key={cat.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{cat.name}</span>
                    <span className="font-medium">
                      {formatPrice(cat.revenue)}{" "}
                      <span className="text-gray-400 text-xs">({pct}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top by revenue */}
        <div className="rounded-lg border bg-white p-5">
          <h3 className="font-bold">Top productos por ingreso</h3>
          {topByRevenue.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">Sin datos.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {topByRevenue.map((p, i) => {
                const pct =
                  currentRevenue > 0
                    ? (p.revenue / currentRevenue) * 100
                    : 0;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium truncate max-w-[250px]">
                        <span className="text-gray-400 mr-1">{i + 1}.</span>
                        {p.name}
                      </span>
                      <span className="shrink-0 ml-2">
                        {formatPrice(p.revenue)}
                        <span className="text-gray-400 text-xs ml-1">
                          ({p.units} uds)
                        </span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded overflow-hidden">
                      <div
                        className="h-full bg-black rounded"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top by units */}
      <div className="mt-8 rounded-lg border bg-white p-5">
        <h3 className="font-bold">Top productos por unidades vendidas</h3>
        {topByUnits.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">Sin datos.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-gray-500">
                <tr>
                  <th className="pb-3 font-medium">#</th>
                  <th className="pb-3 font-medium">Producto</th>
                  <th className="pb-3 font-medium text-right">Unidades</th>
                  <th className="pb-3 font-medium text-right">Ingresos</th>
                  <th className="pb-3 font-medium text-right">% del total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {topByUnits.map((p, i) => (
                  <tr key={i}>
                    <td className="py-3 text-gray-400">{i + 1}</td>
                    <td className="py-3 font-medium">{p.name}</td>
                    <td className="py-3 text-right font-bold">{p.units}</td>
                    <td className="py-3 text-right">
                      {formatPrice(p.revenue)}
                    </td>
                    <td className="py-3 text-right text-gray-500">
                      {currentRevenue > 0
                        ? ((p.revenue / currentRevenue) * 100).toFixed(1)
                        : 0}
                      %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
