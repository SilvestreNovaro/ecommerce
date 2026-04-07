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
  const parentId = (formData.get("parent_id") as string) || null;

  let slug = slugify(name);

  // If it has a parent, prefix slug with parent's slug
  if (parentId) {
    const { data: parent } = await supabase
      .from("categories")
      .select("slug")
      .eq("id", parentId)
      .single();
    if (parent) {
      slug = `${parent.slug}-${slug}`;
    }
  }

  const { error } = await supabase.from("categories").insert({
    name,
    slug,
    parent_id: parentId,
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

// Get all category IDs including subcategories
async function getCategoryAndChildIds(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never, categoryId: string) {
  const { data: children } = await supabase
    .from("categories")
    .select("id")
    .eq("parent_id", categoryId);
  const childIds = (children ?? []).map((c) => c.id);
  return [categoryId, ...childIds];
}

export async function getCategoryProductCount(categoryId: string) {
  const supabase = await createClient();
  const allIds = await getCategoryAndChildIds(supabase, categoryId);
  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .in("category_id", allIds);
  return count ?? 0;
}

export async function deleteCategoryOnly(categoryId: string) {
  const supabase = await createClient();
  const allIds = await getCategoryAndChildIds(supabase, categoryId);

  // Unlink products from this category and subcategories
  await supabase
    .from("products")
    .update({ category_id: null })
    .in("category_id", allIds);

  // Delete subcategories first, then parent (cascade should handle it but be explicit)
  await supabase
    .from("categories")
    .delete()
    .eq("parent_id", categoryId);

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/categorias");
}

export async function deleteCategoryWithProducts(categoryId: string) {
  const supabase = await createClient();
  const allIds = await getCategoryAndChildIds(supabase, categoryId);

  // Delete all products in this category and subcategories
  await supabase
    .from("products")
    .delete()
    .in("category_id", allIds);

  // Delete subcategories first, then parent
  await supabase
    .from("categories")
    .delete()
    .eq("parent_id", categoryId);

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/categorias");
}
