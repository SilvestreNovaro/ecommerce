"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createCategory(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;

  const { error } = await supabase.from("categories").insert({
    name,
    slug: slugify(name),
  });

  if (error) throw new Error(error.message);
  redirect("/admin/categorias");
}

export async function updateCategory(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;

  const { error } = await supabase
    .from("categories")
    .update({ name, slug: slugify(name) })
    .eq("id", id);

  if (error) throw new Error(error.message);
  redirect("/admin/categorias");
}

export async function deleteCategory(categoryId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/categorias");
}
