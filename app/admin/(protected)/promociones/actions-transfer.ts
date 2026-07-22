"use server";

import { revalidatePath } from "next/cache";
import { requireWrite } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { setTransferDiscount } from "@/lib/settings";

// Guarda el descuento por transferencia global: activo/inactivo + %.
export async function saveTransferDiscount(formData: FormData): Promise<void> {
  const user = await requireWrite("promociones");
  const enabled = formData.get("enabled") != null; // checkbox: presente = activo
  const pct = Number(formData.get("pct"));
  await setTransferDiscount(enabled, pct);
  await audit(user, "transfer_discount_updated", {
    type: "store_settings",
    details: { enabled, pct: Math.min(90, Math.max(0, pct || 0)) },
  });
  // El % afecta los precios mostrados en toda la tienda.
  revalidatePath("/admin/promociones");
  revalidatePath("/admin/catalogo");
  revalidatePath("/");
  revalidatePath("/productos");
  revalidatePath("/carrito");
  revalidatePath("/checkout");
}
