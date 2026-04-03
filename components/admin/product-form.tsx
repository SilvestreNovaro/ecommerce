"use client";

import type { Product } from "@/types";

type Props = {
  product?: Product;
  action: (formData: FormData) => Promise<void>;
};

export function ProductForm({ product, action }: Props) {
  return (
    <form action={action} className="max-w-xl space-y-4">
      {product && <input type="hidden" name="id" value={product.id} />}

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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-medium">
            Precio
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
      </div>

      <div>
        <label htmlFor="image_url" className="block text-sm font-medium">
          URL de imagen
        </label>
        <input
          id="image_url"
          name="image_url"
          type="url"
          defaultValue={product?.image_url ?? ""}
          placeholder="https://..."
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

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
