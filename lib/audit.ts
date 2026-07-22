import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminUser } from "@/lib/permissions";

/** Registra una mutación del admin en audit_logs. Fail-open: nunca rompe la acción. */
export async function audit(
  user: AdminUser,
  action: string,
  target?: { type?: string; id?: string; details?: Record<string, unknown> }
): Promise<void> {
  try {
    const h = await headers();
    const ip = h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    const db = createAdminClient();
    await db.from("audit_logs").insert({
      admin_id: user.id,
      admin_email: user.email,
      action,
      target_type: target?.type ?? null,
      target_id: target?.id ?? null,
      details: target?.details ?? null,
      ip_address: ip,
    });
  } catch {
    // fail-open
  }
}
