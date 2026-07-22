import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canWrite, hasPermission, type AdminUser, type SectionKey } from "@/lib/permissions";

// Emails que siempre son admin (bootstrap): si están acá pero no en admin_users,
// se les crea la fila como admin. Una fila DESACTIVADA no se re-promueve.
function bootstrapEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Usuario del backoffice actual, o null. admin_users se lee SOLO por service role. */
export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return null;

  const db = createAdminClient();
  const { data: row } = await db
    .from("admin_users")
    .select("id, email, full_name, role, permissions, active")
    .eq("id", user.id)
    .maybeSingle();

  if (row) {
    if (!row.active) return null;
    return {
      ...row,
      permissions: (row.permissions as string[] | null) ?? null,
    } as AdminUser;
  }

  // Bootstrap por ADMIN_EMAILS: crea la fila para no quedar afuera del panel.
  if (bootstrapEmails().includes(user.email.toLowerCase())) {
    const fresh = {
      id: user.id,
      email: user.email,
      full_name: (user.user_metadata?.full_name as string) ?? null,
      role: "admin" as const,
      permissions: null,
      active: true,
    };
    await db.from("admin_users").insert(fresh);
    return fresh;
  }

  return null;
}

/** Guard de páginas: exige sesión de backoffice con acceso a la sección. */
export async function requireSection(section: SectionKey): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  if (!hasPermission(user, section)) redirect("/admin");
  return user;
}

/** Guard de server actions/APIs de escritura. Tira error (no redirect). */
export async function requireWrite(section: SectionKey): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user || !canWrite(user, section)) {
    throw new Error("No autorizado");
  }
  return user;
}

/** Guard para API routes: devuelve el usuario o null (la route responde 401/403). */
export async function verifyAdminWithPermission(section: SectionKey): Promise<AdminUser | null> {
  const user = await getAdminUser();
  if (!user || !hasPermission(user, section)) return null;
  return user;
}

export async function verifyAdminCanWrite(section: SectionKey): Promise<AdminUser | null> {
  const user = await getAdminUser();
  if (!user || !canWrite(user, section)) return null;
  return user;
}
