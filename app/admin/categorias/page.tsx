import { createClient } from "@/lib/supabase/server";
import { CategoryForm } from "@/components/admin/category-form";
import { DeleteCategoryButton } from "@/components/admin/delete-category-button";
import { createCategory } from "./actions";
import type { Category } from "@/types";

export default async function AdminCategoriasPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  const categories = (data ?? []) as Category[];

  return (
    <div>
      <h2 className="text-2xl font-bold">Categorías</h2>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <h3 className="text-lg font-medium">Nueva categoría</h3>
          <div className="mt-3">
            <CategoryForm action={createCategory} />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium">
            Categorías existentes ({categories.length})
          </h3>
          {categories.length === 0 ? (
            <p className="mt-3 text-gray-500">No hay categorías todavía.</p>
          ) : (
            <ul className="mt-3 divide-y rounded-lg border">
              {categories.map((cat) => (
                <li
                  key={cat.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{cat.name}</p>
                    <p className="text-xs text-gray-400">{cat.slug}</p>
                  </div>
                  <DeleteCategoryButton categoryId={cat.id} categoryName={cat.name} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
