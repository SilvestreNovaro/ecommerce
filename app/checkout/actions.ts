"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type CartItem = {
  productId: string;
  quantity: number;
};

type CheckoutResult = {
  success: boolean;
  error?: string;
  orderId?: string;
};

export async function createOrder(
  items: CartItem[],
  shippingAddress: string
): Promise<CheckoutResult> {
  const supabase = await createClient();

  // 1. Verify user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Debés iniciar sesión para comprar." };
  }

  if (items.length === 0) {
    return { success: false, error: "El carrito está vacío." };
  }

  if (!shippingAddress.trim()) {
    return { success: false, error: "La dirección de envío es obligatoria." };
  }

  // 2. Fetch real product data from DB (never trust client prices)
  const productIds = items.map((item) => item.productId);
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, price, stock, active")
    .in("id", productIds);

  if (productsError || !products) {
    return { success: false, error: "Error al verificar productos." };
  }

  // 3. Validate each item
  const productMap = new Map(products.map((p) => [p.id, p]));
  const validatedItems: { productId: string; quantity: number; unitPrice: number; name: string }[] = [];

  for (const item of items) {
    const product = productMap.get(item.productId);

    if (!product) {
      return { success: false, error: `Producto no encontrado.` };
    }

    if (!product.active) {
      return {
        success: false,
        error: `"${product.name}" ya no está disponible.`,
      };
    }

    if (item.quantity <= 0) {
      return { success: false, error: `Cantidad inválida para "${product.name}".` };
    }

    if (product.stock < item.quantity) {
      return {
        success: false,
        error:
          product.stock === 0
            ? `"${product.name}" está agotado.`
            : `"${product.name}" solo tiene ${product.stock} unidades disponibles.`,
      };
    }

    validatedItems.push({
      productId: product.id,
      quantity: item.quantity,
      unitPrice: product.price,
      name: product.name,
    });
  }

  // 4. Calculate total on the server
  const total = validatedItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  // 5. Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      total,
      shipping_address: shippingAddress,
      status: "pending",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { success: false, error: "Error al crear la orden." };
  }

  // 6. Create order items
  const orderItems = validatedItems.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    quantity: item.quantity,
    unit_price: item.unitPrice,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) {
    // Rollback: delete the order
    await supabase.from("orders").delete().eq("id", order.id);
    return { success: false, error: "Error al guardar los productos." };
  }

  // 7. Decrement stock and record movements
  for (const item of validatedItems) {
    const product = productMap.get(item.productId)!;
    const newStock = product.stock - item.quantity;

    await supabase
      .from("products")
      .update({ stock: newStock, updated_at: new Date().toISOString() })
      .eq("id", item.productId);

    await supabase.from("stock_movements").insert({
      product_id: item.productId,
      type: "sale",
      quantity: -item.quantity,
      previous_stock: product.stock,
      new_stock: newStock,
      reason: `Venta - Orden #${order.id.slice(0, 8)}`,
      created_by: user.id,
    });
  }

  // 8. Send confirmation email (fire and forget)
  // This is done client-side after redirect

  return { success: true, orderId: order.id };
}
