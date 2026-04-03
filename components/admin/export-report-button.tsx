"use client";

type ReportData = {
  period: string;
  revenue: number;
  orders: number;
  avgTicket: number;
  categorySales: { name: string; revenue: number; units: number }[];
  topByRevenue: { name: string; revenue: number; units: number }[];
  dailyTrend: { date: string; revenue: number; orders: number }[];
};

export function ExportReportButton({ data }: { data: ReportData }) {
  function handleExport() {
    const lines: string[] = [];

    lines.push(`Reporte de ventas - ${data.period}`);
    lines.push(`Generado: ${new Date().toLocaleString("es-AR")}`);
    lines.push("");

    lines.push("RESUMEN");
    lines.push(`Ingresos,${data.revenue}`);
    lines.push(`Órdenes,${data.orders}`);
    lines.push(`Ticket promedio,${data.avgTicket}`);
    lines.push("");

    lines.push("VENTAS POR CATEGORÍA");
    lines.push("Categoría,Ingresos,Unidades");
    for (const cat of data.categorySales) {
      lines.push(`"${cat.name}",${cat.revenue},${cat.units}`);
    }
    lines.push("");

    lines.push("TOP PRODUCTOS POR INGRESO");
    lines.push("Producto,Ingresos,Unidades");
    for (const p of data.topByRevenue) {
      lines.push(`"${p.name}",${p.revenue},${p.units}`);
    }
    lines.push("");

    lines.push("VENTAS DIARIAS");
    lines.push("Fecha,Ingresos,Órdenes");
    for (const day of data.dailyTrend) {
      lines.push(`${day.date},${day.revenue},${day.orders}`);
    }

    const csv = lines.join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-${data.period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
    >
      Exportar CSV
    </button>
  );
}
