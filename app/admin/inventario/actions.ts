"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function adjustStock(
  productId: string,
  adjustment: number,
  type: "in" | "out" | "adjustment" | "return",
  reason: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get current stock
  const { data: product } = await supabase
    .from("products")
    .select("stock")
    .eq("id", productId)
    .single();

  if (!product) throw new Error("Producto no encontrado");

  const previousStock = product.stock;
  const newStock = previousStock + adjustment;

  if (newStock < 0) throw new Error("El stock no puede ser negativo");

  // Update stock
  const { error: updateError } = await supabase
    .from("products")
    .update({ stock: newStock, updated_at: new Date().toISOString() })
    .eq("id", productId);

  if (updateError) throw new Error(updateError.message);

  // Record movement
  const { error: movementError } = await supabase
    .from("stock_movements")
    .insert({
      product_id: productId,
      type,
      quantity: adjustment,
      previous_stock: previousStock,
      new_stock: newStock,
      reason: reason || null,
      created_by: user?.id ?? null,
    });

  if (movementError) throw new Error(movementError.message);

  revalidatePath("/admin/inventario");
}

export async function bulkUpdateStock(
  updates: { productId: string; newStock: number }[]
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  for (const update of updates) {
    const { data: product } = await supabase
      .from("products")
      .select("stock")
      .eq("id", update.productId)
      .single();

    if (!product) continue;

    const previousStock = product.stock;
    const adjustment = update.newStock - previousStock;

    if (adjustment === 0) continue;

    await supabase
      .from("products")
      .update({ stock: update.newStock, updated_at: new Date().toISOString() })
      .eq("id", update.productId);

    await supabase.from("stock_movements").insert({
      product_id: update.productId,
      type: "adjustment",
      quantity: adjustment,
      previous_stock: previousStock,
      new_stock: update.newStock,
      reason: "Ajuste masivo de inventario",
      created_by: user?.id ?? null,
    });
  }

  revalidatePath("/admin/inventario");
}

export async function updateProductInventorySettings(formData: FormData) {
  const supabase = await createClient();

  const id = formData.get("id") as string;
  const sku = (formData.get("sku") as string) || null;
  const costPrice = Number(formData.get("cost_price")) || 0;
  const lowStockThreshold = Number(formData.get("low_stock_threshold")) || 5;

  const { error } = await supabase
    .from("products")
    .update({
      sku,
      cost_price: costPrice,
      low_stock_threshold: lowStockThreshold,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/inventario");
}
