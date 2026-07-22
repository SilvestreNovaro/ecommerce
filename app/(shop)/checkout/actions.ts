"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { quoteCart } from "@/lib/quote";
import { sendOrderConfirmation } from "@/lib/resend/emails";

type CartItem = {
  productId: string;
  quantity: number;
};

export type CheckoutInput = {
  items: CartItem[];
  customerName: string;
  customerPhone: string;
  fulfillment: "pickup" | "delivery";
  shipAddress?: string;
  shipCity?: string;
  shipProvince?: string;
  shipZip?: string;
  shipNotes?: string;
};

type CheckoutResult = {
  success: boolean;
  error?: string;
  orderId?: string;
};

const MAX_ITEMS = 30;
const MAX_QTY = 50;

// Crea la orden (pago por transferencia). Modelo SUK: precios recalculados
// desde la DB, snapshot de contacto, payment_status separado del logístico.
export async function createOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return { success: false, error: "Debés iniciar sesión para comprar." };
  }

  const items = (input.items ?? []).slice(0, MAX_ITEMS);
  if (items.length === 0) return { success: false, error: "El carrito está vacío." };

  const customerName = (input.customerName ?? "").trim().slice(0, 120);
  const customerPhone = (input.customerPhone ?? "").replace(/\D/g, "").slice(0, 20);
  if (!customerName) return { success: false, error: "Ingresá tu nombre completo." };
  if (customerPhone.length < 8) return { success: false, error: "Ingresá un teléfono válido (solo números)." };

  const fulfillment = input.fulfillment === "delivery" ? "delivery" : "pickup";
  const shipAddress = (input.shipAddress ?? "").trim().slice(0, 200);
  if (fulfillment === "delivery" && !shipAddress) {
    return { success: false, error: "Ingresá la dirección de envío." };
  }

  // Precios, promos y descuento por transferencia SIEMPRE server-side, con el
  // MISMO cálculo que ve el cliente en carrito/checkout (lib/quote.ts):
  //   unit_price snapshot = precio final unitario (oferta + mejor promo,
  //   prorrateada por línea y redondeada a pesos enteros);
  //   total = subtotal (post-promos) - descuento por transferencia.
  const admin = createAdminClient();
  const quote = await quoteCart(
    items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
  );

  const validated: { productId: string; name: string; quantity: number; unitPrice: number; lineTotal: number }[] = [];
  for (const item of items) {
    const line = quote.lines.find((l) => l.productId === item.productId);
    if (!line) return { success: false, error: "Producto no encontrado." };
    if (line.unavailable) return { success: false, error: `"${line.name}" ya no está disponible.` };
    const qty = Math.floor(item.quantity);
    if (qty <= 0 || qty > MAX_QTY || qty !== line.qty) {
      return { success: false, error: `Cantidad inválida para "${line.name}".` };
    }
    if (line.stock < qty) {
      return {
        success: false,
        error:
          line.stock === 0
            ? `"${line.name}" está agotado.`
            : `"${line.name}" no tiene suficientes unidades disponibles. Bajá la cantidad.`,
      };
    }
    validated.push({
      productId: line.productId,
      name: line.name,
      quantity: qty,
      unitPrice: line.unitFinal,
      lineTotal: line.lineTotal,
    });
  }

  const subtotal = quote.subtotal; // post-promos, pre-transferencia
  const total = quote.total; // subtotal - descuento por transferencia (shipping a coordinar)

  // Garantizar el profile antes de la FK (patrón SUK).
  await admin.from("profiles").upsert(
    {
      id: user.id,
      email: user.email,
      full_name: customerName,
      phone: customerPhone,
    },
    { onConflict: "id" }
  );

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: user.id,
      customer_name: customerName,
      customer_email: user.email,
      customer_phone: customerPhone,
      payment_method: "transfer",
      payment_status: "pending",
      logistic_status: "received",
      fulfillment,
      ship_address: fulfillment === "delivery" ? shipAddress : null,
      ship_city: fulfillment === "delivery" ? (input.shipCity ?? "").trim().slice(0, 80) || null : null,
      ship_province: fulfillment === "delivery" ? (input.shipProvince ?? "").trim().slice(0, 80) || null : null,
      ship_zip: fulfillment === "delivery" ? (input.shipZip ?? "").trim().slice(0, 12) || null : null,
      ship_notes: (input.shipNotes ?? "").trim().slice(0, 300) || null,
      subtotal,
      shipping_cost: 0,
      promo_discount: quote.promoDiscount,
      transfer_discount: quote.transferDiscount,
      total,
    })
    .select("id, order_number")
    .single();
  if (orderError || !order) {
    return { success: false, error: "Error al crear la orden." };
  }

  const orderItems = validated.map((it) => ({
    order_id: order.id,
    product_id: it.productId,
    product_name: it.name,
    quantity: it.quantity,
    unit_price: it.unitPrice, // snapshot: precio final unitario (con promos)
    subtotal: it.lineTotal,
  }));
  const { error: itemsError } = await admin.from("order_items").insert(orderItems);
  if (itemsError) {
    await admin.from("orders").delete().eq("id", order.id);
    return { success: false, error: "Error al guardar los productos." };
  }

  // Descontar stock + registrar movimientos (inventario heredado de Nalika v1).
  const stockByProduct = new Map(quote.lines.map((l) => [l.productId, l.stock]));
  for (const it of validated) {
    const prevStock = stockByProduct.get(it.productId) ?? 0;
    const newStock = prevStock - it.quantity;
    await admin
      .from("products")
      .update({ stock: newStock, updated_at: new Date().toISOString() })
      .eq("id", it.productId);
    await admin.from("stock_movements").insert({
      product_id: it.productId,
      type: "sale",
      quantity: -it.quantity,
      previous_stock: prevStock,
      new_stock: newStock,
      reason: `Venta - Pedido #${order.order_number}`,
      created_by: user.id,
    });
  }

  // Email de confirmación: fire-and-forget, nunca rompe el checkout.
  sendOrderConfirmation({
    to: user.email,
    orderNumber: order.order_number,
    customerName,
    total,
    fulfillment,
    items: validated.map((it) => ({ name: it.name, quantity: it.quantity })),
  }).catch(() => {});

  return { success: true, orderId: order.id };
}
