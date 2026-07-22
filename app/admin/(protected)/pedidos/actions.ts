"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireWrite } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";

const LOGISTIC = ["received", "preparing", "shipped", "delivered", "cancelled"] as const;

// Confirmar pago de transferencia (un click): pending → paid Y, en simultáneo,
// logístico received → preparing (no se prepara nada sin pago confirmado).
export async function confirmTransferPayment(formData: FormData): Promise<void> {
  const user = await requireWrite("pedidos");
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("falta id");

  const admin = createAdminClient();
  const { error } = await admin
    .from("orders")
    .update({
      payment_status: "paid",
      paid_at: new Date().toISOString(),
      logistic_status: "preparing",
    })
    .eq("id", id)
    .eq("payment_status", "pending");
  if (error) throw new Error(`confirmTransferPayment: ${error.message}`);

  await audit(user, "order_payment_confirmed", { type: "order", id });
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);
}

// Cambiar estado logístico (preparing → shipped → delivered, o cancelado).
export async function setLogisticStatus(formData: FormData): Promise<void> {
  const user = await requireWrite("pedidos");
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id) throw new Error("falta id");
  if (!LOGISTIC.includes(status as (typeof LOGISTIC)[number])) {
    throw new Error("estado inválido");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("orders")
    .update({ logistic_status: status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`setLogisticStatus: ${error.message}`);

  await audit(user, "order_logistic_status", { type: "order", id, details: { status } });
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);
}
