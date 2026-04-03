import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/product-form";
import { createProduct } from "../actions";
import type { Category } from "@/types";

export default async function NuevoProductoPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").order("name");
  const categories = (data ?? []) as Category[];

  return (
    <div>
      <h2 className="text-2xl font-bold">Nuevo producto</h2>
      <div className="mt-6">
        <ProductForm categories={categories} action={createProduct} />
      </div>
    </div>
  );
}
