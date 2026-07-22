import { requireSection } from "@/lib/admin-auth";
import SqlConsole from "@/components/admin/sql-console";

export const dynamic = "force-dynamic";

export default async function AdminConsultasPage() {
  await requireSection("consultas");
  return <SqlConsole />;
}
