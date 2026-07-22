import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { computePrices } from "@/lib/pricing";
import { getActivePromotions, lineDiscount } from "@/lib/promotions";
import { getStoreSettings } from "@/lib/settings";

// ÚNICA fuente de verdad del cálculo del carrito: la usan /api/cart/quote
// (carrito + resumen del checkout) y createOrder (checkout server action).
// Así el total mostrado y el total cobrado salen del MISMO cálculo server-side.
//
// Modelo (todo integer en pesos, Math.round en cada paso):
//   1. unit vigente = promo_price si es oferta válida, si no price.
//   2. Mejor promo del módulo por línea (lineDiscount) sobre el unit vigente.
//      unitFinal = round((unit*qty - descuento) / qty) → snapshot por unidad.
//   3. subtotal = Σ lineTotal (post-promos). El descuento por transferencia
//      (global, %) se aplica SOBRE ese subtotal → total = subtotal - transferencia.

export type QuoteItemIn = { productId: string; quantity: number };

export type QuoteLine = {
  productId: string;
  name: string;
  qty: number;
  stock: number;
  active: boolean;
  unavailable: boolean;
  unitList: number; // precio de lista por unidad
  unitFinal: number; // precio final por unidad (promo aplicada, redondeado)
  lineList: number; // unitList * qty
  lineTotal: number; // unitFinal * qty
  promoName: string | null; // promo del módulo aplicada (si hubo)
  hasDiscount: boolean; // unitFinal < unitList
};

export type CartQuote = {
  lines: QuoteLine[];
  listSubtotal: number; // Σ a precio de lista
  subtotal: number; // Σ lineTotal (con promos aplicadas)
  promoDiscount: number; // listSubtotal - subtotal
  transferPct: number;
  transferDiscount: number; // descuento por transferencia sobre subtotal
  totalTransfer: number; // subtotal - transferDiscount (lo que se paga por transferencia)
  total: number; // = totalTransfer (Nalika hoy solo cobra por transferencia)
  saving: number; // listSubtotal - total ("Ahorrás $X")
  count: number;
};

const clampQty = (n: unknown) => Math.max(1, Math.min(99, Math.floor(Number(n) || 1)));

export async function quoteCart(items: QuoteItemIn[]): Promise<CartQuote> {
  const clean = (items ?? []).filter((i) => i && i.productId).slice(0, 50);
  const empty: CartQuote = {
    lines: [], listSubtotal: 0, subtotal: 0, promoDiscount: 0,
    transferPct: 0, transferDiscount: 0, totalTransfer: 0, total: 0, saving: 0, count: 0,
  };
  if (clean.length === 0) return empty;

  const db = createAdminClient();
  const ids = Array.from(new Set(clean.map((i) => i.productId)));
  const [{ data: products }, { data: cats }, promos, settings] = await Promise.all([
    db.from("products").select("id, name, price, promo_price, stock, active, category_id").in("id", ids),
    db.from("categories").select("id, parent_id"),
    getActivePromotions(),
    getStoreSettings(),
  ]);
  const productMap = new Map((products ?? []).map((p) => [p.id, p]));
  const parentOf = new Map((cats ?? []).map((c) => [c.id, c.parent_id as string | null]));

  let listSubtotal = 0;
  let subtotal = 0;
  let count = 0;

  const lines: QuoteLine[] = clean.map((it) => {
    const qty = clampQty(it.quantity);
    const p = productMap.get(it.productId);
    if (!p || !p.active) {
      return {
        productId: it.productId, name: p?.name ?? "Producto no disponible", qty,
        stock: p?.stock ?? 0, active: false, unavailable: true,
        unitList: 0, unitFinal: 0, lineList: 0, lineTotal: 0, promoName: null, hasDiscount: false,
      };
    }
    const pr = computePrices(
      { price: Number(p.price), promo_price: p.promo_price != null ? Number(p.promo_price) : null },
      settings.transferPct,
      settings.transferEnabled
    );
    // Subcategorías heredan las promos de la categoría padre.
    const categoryIds: string[] = [];
    if (p.category_id) {
      categoryIds.push(p.category_id);
      const parent = parentOf.get(p.category_id);
      if (parent) categoryIds.push(parent);
    }
    const { amount: disc, promo } = lineDiscount(promos, {
      productId: p.id, categoryIds, unit: pr.current, qty,
    });
    const lineExact = Math.max(0, pr.current * qty - disc);
    const unitFinal = Math.round(lineExact / qty);
    const lineTotal = unitFinal * qty;
    const lineList = pr.normal * qty;

    listSubtotal += lineList;
    subtotal += lineTotal;
    count += qty;

    return {
      productId: p.id, name: p.name, qty, stock: p.stock, active: p.active, unavailable: false,
      unitList: pr.normal, unitFinal, lineList, lineTotal,
      promoName: promo?.nombre ?? null, hasDiscount: unitFinal < pr.normal,
    };
  });

  const pct = settings.transferEnabled ? Math.min(90, Math.max(0, settings.transferPct)) : 0;
  const transferDiscount = pct > 0 ? Math.round(subtotal * (pct / 100)) : 0;
  const totalTransfer = subtotal - transferDiscount;

  return {
    lines,
    listSubtotal,
    subtotal,
    promoDiscount: listSubtotal - subtotal,
    transferPct: pct,
    transferDiscount,
    totalTransfer,
    total: totalTransfer,
    saving: Math.max(0, listSubtotal - totalTransfer),
    count,
  };
}
