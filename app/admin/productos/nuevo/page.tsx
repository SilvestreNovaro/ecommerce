import { ProductForm } from "@/components/admin/product-form";
import { createProduct } from "../actions";

export default function NuevoProductoPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold">Nuevo producto</h2>
      <div className="mt-6">
        <ProductForm action={createProduct} />
      </div>
    </div>
  );
}
