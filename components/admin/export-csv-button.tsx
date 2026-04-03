"use client";

type InventoryRow = {
  name: string;
  sku: string | null;
  stock: number;
  cost_price: number;
  price: number;
  category: string;
};

export function ExportCsvButton({ data }: { data: InventoryRow[] }) {
  function handleExport() {
    const headers = ["Nombre", "SKU", "Stock", "Costo", "Precio Venta", "Categoría", "Valor Stock"];
    const rows = data.map((row) => [
      row.name,
      row.sku ?? "",
      row.stock,
      row.cost_price,
      row.price,
      row.category,
      row.cost_price * row.stock,
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventario-${new Date().toISOString().slice(0, 10)}.csv`;
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
