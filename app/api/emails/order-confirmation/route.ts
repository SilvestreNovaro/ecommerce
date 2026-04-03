import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendOrderConfirmation } from "@/lib/resend/emails";

export async function POST(request: Request) {
  const { orderId } = await request.json();

  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get order with items and product names
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const { data: orderItems } = await supabase
    .from("order_items")
    .select("quantity, unit_price, product_id")
    .eq("order_id", orderId);

  if (!orderItems || orderItems.length === 0) {
    return NextResponse.json({ error: "No items found" }, { status: 404 });
  }

  // Get product names
  const productIds = orderItems.map((item) => item.product_id);
  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .in("id", productIds);

  const productMap = new Map(products?.map((p) => [p.id, p.name]) ?? []);

  const items = orderItems.map((item) => ({
    name: productMap.get(item.product_id) ?? "Producto",
    quantity: item.quantity,
    unit_price: item.unit_price,
  }));

  const { error } = await sendOrderConfirmation(
    user.email!,
    orderId,
    items,
    order.total
  );

  if (error) {
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
