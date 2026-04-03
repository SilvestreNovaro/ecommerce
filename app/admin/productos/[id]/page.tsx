import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/product-form";
import { updateProduct } from "../actions";
import type { Product, Category } from "@/types";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditarProductoPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).single(),
    supabase.from("categories").select("*").order("name"),
  ]);

  if (!product) notFound();

  return (
    <div>
      <h2 className="text-2xl font-bold">Editar producto</h2>
      <div className="mt-6">
        <ProductForm
          product={product as Product}
          categories={(categories ?? []) as Category[]}
          action={updateProduct}
        />
      </div>
    </div>
  );
}
