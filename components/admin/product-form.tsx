"use client";

import { useState } from "react";
import { ImageUpload } from "./image-upload";
import type { Product, Category } from "@/types";

type Props = {
  product?: Product;
  categories: Category[];
  action: (formData: FormData) => Promise<void>;
};

export function ProductForm({ product, categories, action }: Props) {
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");

  return (
    <form action={action} className="max-w-xl space-y-4">
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="image_url" value={imageUrl} />

      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Nombre
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={product?.name}
          required
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={product?.description}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <div>
        <label htmlFor="category_id" className="block text-sm font-medium">
          Categoría
        </label>
        <select
          id="category_id"
          name="category_id"
          defaultValue={product?.category_id ?? ""}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="">Sin categoría</option>
          {categories
            .filter((c) => !c.parent_id)
            .map((parent) => {
              const children = categories.filter(
                (c) => c.parent_id === parent.id
              );
              return children.length > 0 ? (
                <optgroup key={parent.id} label={parent.name}>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.name}
                    </option>
                  ))}
                </optgroup>
              ) : (
                <option key={parent.id} value={parent.id}>
                  {parent.name}
                </option>
              );
            })}
        </select>
      </div>

      <div>
        <label htmlFor="sku" className="block text-sm font-medium">
          SKU
        </label>
        <input
          id="sku"
          name="sku"
          type="text"
          defaultValue={product?.sku ?? ""}
          placeholder="Ej: PROD-001"
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-medium">
            Precio venta
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            defaultValue={product?.price}
            required
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        <div>
          <label htmlFor="stock" className="block text-sm font-medium">
            Stock
          </label>
          <input
            id="stock"
            name="stock"
            type="number"
            min="0"
            defaultValue={product?.stock ?? 0}
            required
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        <div>
          <label htmlFor="cost_price" className="block text-sm font-medium">
            Costo
          </label>
          <input
            id="cost_price"
            name="cost_price"
            type="number"
            min="0"
            defaultValue={product?.cost_price ?? 0}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
      </div>

      <ImageUpload currentUrl={product?.image_url} onUpload={setImageUrl} />

      <div className="flex items-center gap-2">
        <input
          id="active"
          name="active"
          type="checkbox"
          defaultChecked={product?.active ?? true}
          className="h-4 w-4 rounded border"
        />
        <label htmlFor="active" className="text-sm font-medium">
          Activo (visible en la tienda)
        </label>
      </div>

      <button
        type="submit"
        className="rounded-md bg-black px-6 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        {product ? "Guardar cambios" : "Crear producto"}
      </button>
    </form>
  );
}
