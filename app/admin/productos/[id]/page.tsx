import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/product-form";
import { updateProduct } from "../actions";
import type { Product } from "@/types";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditarProductoPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) notFound();

  return (
    <div>
      <h2 className="text-2xl font-bold">Editar producto</h2>
      <div className="mt-6">
        <ProductForm product={data as Product} action={updateProduct} />
      </div>
    </div>
  );
}
