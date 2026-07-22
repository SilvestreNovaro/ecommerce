import { requireSection } from "@/lib/admin-auth";
import UsersAdmin from "@/components/admin/users-admin";

export const dynamic = "force-dynamic";

export default async function AdminUsuariosPage() {
  await requireSection("usuarios");
  return <UsersAdmin />;
}
