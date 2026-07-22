export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminWithPermission } from "@/lib/admin-auth";

const METHOD: Record<string, string> = { transfer: "Transferencia", mercado_pago: "Mercado Pago" };
const PAY: Record<string, string> = { pending: "Pendiente de pago", paid: "Pagado", rejected: "Rechazado" };
const LOG: Record<string, string> = {
  received: "Recibido",
  preparing: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? "" : String(v);
  // Anti CSV/formula injection: si arranca con = + - @ (o tab/CR), prefijo apóstrofo
  // para que Excel/Sheets no lo ejecute como fórmula.
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}
function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(csvCell).join(","), ...rows.map((r) => r.map(csvCell).join(","))];
  return "﻿" + lines.join("\r\n"); // BOM para que Excel lea UTF-8
}
function fileResponse(csv: string, name: string) {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
    },
  });
}

export async function GET(req: Request) {
  const auth = await verifyAdminWithPermission("exportar");
  if (!auth) return new Response("No autorizado", { status: 401 });

  const url = new URL(req.url);
  const type = url.searchParams.get("type") === "clientes" ? "clientes" : "pedidos";
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const admin = createAdminClient();
  const stamp = (from || "") + (from || to ? "_" : "") + (to || "");

  if (type === "clientes") {
    const [{ data: profiles }, { data: orders }, { data: adminRows }] = await Promise.all([
      admin.from("profiles").select("id, email, full_name, phone, created_at").order("created_at", { ascending: false }),
      admin.from("orders").select("user_id, total, logistic_status, created_at"),
      admin.from("admin_users").select("id"),
    ]);
    const adminIds = new Set((adminRows ?? []).map((a) => a.id));
    const stats = new Map<string, { count: number; total: number; last: string | null }>();
    for (const o of orders ?? []) {
      if (!o.user_id) continue;
      const s = stats.get(o.user_id) || { count: 0, total: 0, last: null };
      s.count += 1;
      if (o.logistic_status !== "cancelled") s.total += Number(o.total) || 0;
      if (!s.last || o.created_at > s.last) s.last = o.created_at;
      stats.set(o.user_id, s);
    }
    const rows = (profiles ?? [])
      .filter((p) => !adminIds.has(p.id))
      .map((p) => {
        const s = stats.get(p.id);
        return [
          p.full_name || "",
          p.email,
          p.phone || "",
          s?.count ?? 0,
          s?.total ?? 0,
          p.created_at?.slice(0, 10) ?? "",
          s?.last?.slice(0, 10) ?? "",
        ];
      });
    return fileResponse(
      toCsv(["Nombre", "Email", "Teléfono", "Pedidos", "Total gastado", "Alta", "Último pedido"], rows),
      `clientes_nalika_${stamp || "todos"}.csv`
    );
  }

  // type === "pedidos": una fila por ítem
  let q = admin
    .from("orders")
    .select(
      "id, order_number, created_at, payment_method, payment_status, logistic_status, fulfillment, customer_name, customer_email, customer_phone, total"
    )
    .order("created_at", { ascending: false });
  if (from) q = q.gte("created_at", `${from}T00:00:00`);
  if (to) q = q.lte("created_at", `${to}T23:59:59.999`);
  const { data: orders } = await q;
  const orderList = orders ?? [];

  const itemsByOrder = new Map<
    string,
    { product_name: string; quantity: number; unit_price: number; subtotal: number }[]
  >();
  if (orderList.length > 0) {
    const { data: items } = await admin
      .from("order_items")
      .select("order_id, product_name, quantity, unit_price, subtotal")
      .in(
        "order_id",
        orderList.map((o) => o.id)
      );
    for (const it of items ?? []) {
      const arr = itemsByOrder.get(it.order_id) || [];
      arr.push(it);
      itemsByOrder.set(it.order_id, arr);
    }
  }

  const rows: unknown[][] = [];
  for (const o of orderList) {
    const its = itemsByOrder.get(o.id) || [];
    const fecha = o.created_at?.slice(0, 10) ?? "";
    const metodo = METHOD[o.payment_method] || o.payment_method;
    const pago = PAY[o.payment_status] || o.payment_status;
    const logistica =
      o.logistic_status === "delivered" && o.fulfillment === "pickup"
        ? "Retirado"
        : LOG[o.logistic_status] || o.logistic_status;
    const entrega = o.fulfillment === "delivery" ? "Envío a domicilio" : "Retiro en Nalika";
    const base = [o.order_number, fecha, metodo, pago, logistica, entrega, o.customer_name, o.customer_email, o.customer_phone];
    if (its.length === 0) {
      rows.push([...base, "", "", "", "", o.total]);
    }
    for (const it of its) {
      rows.push([...base, it.product_name, it.quantity, it.unit_price, it.subtotal, o.total]);
    }
  }
  return fileResponse(
    toCsv(
      [
        "N° Pedido",
        "Fecha",
        "Método de pago",
        "Estado de pago",
        "Estado logístico",
        "Entrega",
        "Cliente",
        "Email",
        "Teléfono",
        "Producto",
        "Cantidad",
        "Precio unitario",
        "Subtotal ítem",
        "Total pedido",
      ],
      rows
    ),
    `pedidos_nalika_${stamp || "todos"}.csv`
  );
}
