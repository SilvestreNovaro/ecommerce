"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createProduct(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const { error } = await supabase.from("products").insert({
    name,
    slug: slugify(name),
    description: formData.get("description") as string,
    price: Number(formData.get("price")),
    stock: Number(formData.get("stock")),
    image_url: (formData.get("image_url") as string) || null,
    category_id: (formData.get("category_id") as string) || null,
    active: formData.get("active") === "on",
  });

  if (error) throw new Error(error.message);
  redirect("/admin/productos");
}

export async function updateProduct(formData: FormData) {
  const supabase = await createClient();

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;

  const { error } = await supabase
    .from("products")
    .update({
      name,
      slug: slugify(name),
      description: formData.get("description") as string,
      price: Number(formData.get("price")),
      stock: Number(formData.get("stock")),
      image_url: (formData.get("image_url") as string) || null,
      category_id: (formData.get("category_id") as string) || null,
      active: formData.get("active") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  redirect("/admin/productos");
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) throw new Error(error.message);
  redirect("/admin/productos");
}
