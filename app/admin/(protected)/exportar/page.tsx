import { requireSection } from "@/lib/admin-auth";
import ExportForm from "./export-form";

export const dynamic = "force-dynamic";

export default async function AdminExportarPage() {
  await requireSection("exportar");
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold text-ink">Exportar CSV</h1>
        <p className="text-sm text-ink/50">
          Descargá los datos de Nalika en formato CSV (se abre en Excel / Google Sheets)
        </p>
      </div>
      <ExportForm />
    </div>
  );
}
