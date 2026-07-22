"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireWrite } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";

export type PromoInput = {
  id?: string;
  nombre: string;
  descripcion: string | null;
  tipo: "porcentaje" | "monto_fijo" | "nxm" | "cantidad_minima";
  alcance: "todo" | "producto" | "categoria";
  product_id: string | null;
  category_id: string | null;
  descuento_porcentaje: number | null;
  descuento_monto: number | null;
  nxm_compra: number | null;
  nxm_paga: number | null;
  cantidad_minima: number | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  activo: boolean;
};

function clampPct(v: number | null) {
  const n = Number(v) || 0;
  return Math.max(0.5, Math.min(100, n));
}

function sanitize(input: PromoInput) {
  const tipo = input.tipo;
  const alcance =
    input.alcance === "producto" || input.alcance === "categoria" ? input.alcance : "todo";
  const payload = {
    nombre: (input.nombre || "").trim().slice(0, 120),
    descripcion: input.descripcion ? input.descripcion.trim().slice(0, 300) : null,
    tipo,
    alcance,
    product_id: alcance === "producto" ? input.product_id || null : null,
    category_id: alcance === "categoria" ? input.category_id || null : null,
    descuento_porcentaje: null as number | null,
    descuento_monto: null as number | null,
    nxm_compra: null as number | null,
    nxm_paga: null as number | null,
    cantidad_minima: null as number | null,
    fecha_inicio: input.fecha_inicio || null,
    fecha_fin: input.fecha_fin || null,
    activo: !!input.activo,
  };
  if (tipo === "porcentaje") {
    payload.descuento_porcentaje = clampPct(input.descuento_porcentaje);
  } else if (tipo === "monto_fijo") {
    // Monto integer en pesos (modelo de precios Nalika).
    payload.descuento_monto = Math.max(1, Math.round(Number(input.descuento_monto) || 0));
  } else if (tipo === "nxm") {
    payload.nxm_compra = Math.max(2, Math.round(Number(input.nxm_compra) || 0));
    payload.nxm_paga = Math.max(1, Math.min(payload.nxm_compra - 1, Math.round(Number(input.nxm_paga) || 0)));
  } else if (tipo === "cantidad_minima") {
    payload.cantidad_minima = Math.max(2, Math.round(Number(input.cantidad_minima) || 0));
    payload.descuento_porcentaje = clampPct(input.descuento_porcentaje);
  }
  return payload;
}

// Las promos afectan los precios que muestra TODA la tienda.
function revalidateShop() {
  revalidatePath("/admin/promociones");
  revalidatePath("/");
  revalidatePath("/productos");
  revalidatePath("/carrito");
  revalidatePath("/checkout");
}

export async function savePromotion(input: PromoInput): Promise<void> {
  const user = await requireWrite("promociones");
  const db = createAdminClient();
  if (!input.nombre?.trim()) throw new Error("El nombre es obligatorio");
  const payload = sanitize(input);
  if (payload.alcance === "producto" && !payload.product_id) throw new Error("Seleccioná un producto");
  if (payload.alcance === "categoria" && !payload.category_id) throw new Error("Seleccioná una categoría");

  if (input.id) {
    const { error } = await db.from("promotions").update(payload).eq("id", input.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await db.from("promotions").insert(payload);
    if (error) throw new Error(error.message);
  }
  await audit(user, input.id ? "promo_updated" : "promo_created", {
    type: "promotion",
    id: input.id,
    details: { nombre: payload.nombre, tipo: payload.tipo, alcance: payload.alcance },
  });
  revalidateShop();
}

export async function deletePromotion(id: string): Promise<void> {
  const user = await requireWrite("promociones");
  const db = createAdminClient();
  const { error } = await db.from("promotions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await audit(user, "promo_deleted", { type: "promotion", id });
  revalidateShop();
}

export async function togglePromotion(id: string, activo: boolean): Promise<void> {
  const user = await requireWrite("promociones");
  const db = createAdminClient();
  const { error } = await db.from("promotions").update({ activo }).eq("id", id);
  if (error) throw new Error(error.message);
  await audit(user, "promo_toggled", { type: "promotion", id, details: { activo } });
  revalidateShop();
}
