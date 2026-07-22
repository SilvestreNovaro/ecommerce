import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type Promotion = {
  id: string;
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
  created_at?: string;
};

/** Promos activas y dentro de su ventana de fechas. */
export async function getActivePromotions(): Promise<Promotion[]> {
  const db = createAdminClient();
  const nowIso = new Date().toISOString();
  const { data } = await db.from("promotions").select("*").eq("activo", true);
  return ((data ?? []) as Promotion[]).filter(
    (p) => (!p.fecha_inicio || p.fecha_inicio <= nowIso) && (!p.fecha_fin || p.fecha_fin >= nowIso)
  );
}

export type PromoLine = {
  productId: string;
  // Categorías que "cubren" al producto: su category_id + el parent de esa
  // categoría (las subcategorías HEREDAN las promos de la categoría padre).
  categoryIds: string[];
  unit: number; // precio unitario vigente (integer en pesos)
  qty: number;
};

/**
 * Descuento ($ integer) de la MEJOR promo que aplica a una línea. No negativo,
 * con tope en el total de la línea. Las promos NO se acumulan entre sí: gana la
 * que más descuenta.
 */
export function lineDiscount(
  promos: Promotion[],
  line: PromoLine
): { amount: number; promo: Promotion | null } {
  const { productId, categoryIds, unit, qty } = line;
  let best = 0;
  let bestPromo: Promotion | null = null;
  for (const p of promos) {
    if (p.alcance === "producto" && p.product_id !== productId) continue;
    if (p.alcance === "categoria" && (!p.category_id || !categoryIds.includes(p.category_id))) continue;
    let d = 0;
    if (p.tipo === "porcentaje" && p.descuento_porcentaje) {
      d = unit * qty * (Number(p.descuento_porcentaje) / 100);
    } else if (p.tipo === "monto_fijo" && p.descuento_monto) {
      d = Math.min(unit, Number(p.descuento_monto)) * qty;
    } else if (p.tipo === "nxm" && p.nxm_compra && p.nxm_paga) {
      const free = Math.floor(qty / p.nxm_compra) * (p.nxm_compra - p.nxm_paga);
      d = free * unit;
    } else if (p.tipo === "cantidad_minima" && p.cantidad_minima && p.descuento_porcentaje) {
      if (qty >= p.cantidad_minima) d = unit * qty * (Number(p.descuento_porcentaje) / 100);
    }
    if (d > best) {
      best = d;
      bestPromo = p;
    }
  }
  best = Math.min(best, unit * qty); // nunca más que el total de la línea
  return { amount: Math.round(best), promo: bestPromo };
}
