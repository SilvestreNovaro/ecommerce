"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  // Precios y stock SIEMPRE desde la DB (nunca del cliente).
  const admin = createAdminClient();
  const productIds = items.map((i) => i.productId);
  const { data: products, error: productsError } = await admin
    .from("products")
    .select("id, name, price, stock, active")
    .in("id", productIds);
  if (productsError || !products) {
    return { success: false, error: "Error al verificar productos." };
  }
  const productMap = new Map(products.map((p) => [p.id, p]));

  const validated: { productId: string; name: string; quantity: number; unitPrice: number }[] = [];
  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) return { success: false, error: "Producto no encontrado." };
    if (!product.active) return { success: false, error: `"${product.name}" ya no está disponible.` };
    const qty = Math.floor(item.quantity);
    if (qty <= 0 || qty > MAX_QTY) return { success: false, error: `Cantidad inválida para "${product.name}".` };
    if (product.stock < qty) {
      return {
        success: false,
        error:
          product.stock === 0
            ? `"${product.name}" está agotado.`
            : `"${product.name}" solo tiene ${product.stock} unidades disponibles.`,
      };
    }
    validated.push({ productId: product.id, name: product.name, quantity: qty, unitPrice: product.price });
  }

  const subtotal = validated.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
  const total = subtotal; // shipping_cost 0 = a coordinar por WhatsApp

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
    unit_price: it.unitPrice,
    subtotal: it.unitPrice * it.quantity,
  }));
  const { error: itemsError } = await admin.from("order_items").insert(orderItems);
  if (itemsError) {
    await admin.from("orders").delete().eq("id", order.id);
    return { success: false, error: "Error al guardar los productos." };
  }

  // Descontar stock + registrar movimientos (inventario heredado de Nalika v1).
  for (const it of validated) {
    const product = productMap.get(it.productId)!;
    const newStock = product.stock - it.quantity;
    await admin
      .from("products")
      .update({ stock: newStock, updated_at: new Date().toISOString() })
      .eq("id", it.productId);
    await admin.from("stock_movements").insert({
      product_id: it.productId,
      type: "sale",
      quantity: -it.quantity,
      previous_stock: product.stock,
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
