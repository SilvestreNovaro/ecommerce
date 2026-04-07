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

  // Separate parent and child categories
  const parentCategories = categories.filter((c) => !c.parent_id);
  const childCategories = categories.filter((c) => c.parent_id);

  // Group children by parent
  const childrenByParent = new Map<string, Category[]>();
  for (const child of childCategories) {
    const existing = childrenByParent.get(child.parent_id!) ?? [];
    existing.push(child);
    childrenByParent.set(child.parent_id!, existing);
  }

  // Count products per category
  const { data: productCounts } = await supabase
    .from("products")
    .select("category_id");

  const countMap = new Map<string, number>();
  for (const p of productCounts ?? []) {
    if (p.category_id) {
      countMap.set(p.category_id, (countMap.get(p.category_id) ?? 0) + 1);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">Categorías</h2>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <h3 className="text-lg font-medium">Nueva categoría</h3>
          <div className="mt-3">
            <CategoryForm
              action={createCategory}
              parentCategories={parentCategories}
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium">
            Categorías ({categories.length})
          </h3>

          {parentCategories.length === 0 ? (
            <p className="mt-3 text-gray-500">No hay categorías todavía.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {parentCategories.map((parent) => {
                const children = childrenByParent.get(parent.id) ?? [];
                const parentProductCount = countMap.get(parent.id) ?? 0;

                return (
                  <div key={parent.id} className="rounded-lg border">
                    {/* Parent */}
                    <div className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="font-medium">{parent.name}</p>
                        <p className="text-xs text-gray-400">
                          {parent.slug}
                          {parentProductCount > 0 && (
                            <span className="ml-2">
                              · {parentProductCount}{" "}
                              {parentProductCount === 1
                                ? "producto"
                                : "productos"}
                            </span>
                          )}
                        </p>
                      </div>
                      <DeleteCategoryButton
                        categoryId={parent.id}
                        categoryName={parent.name}
                      />
                    </div>

                    {/* Children */}
                    {children.length > 0 && (
                      <div className="border-t bg-gray-50">
                        {children.map((child) => {
                          const childProductCount =
                            countMap.get(child.id) ?? 0;
                          return (
                            <div
                              key={child.id}
                              className="flex items-center justify-between px-4 py-2.5 pl-8 border-t first:border-t-0"
                            >
                              <div>
                                <p className="text-sm">{child.name}</p>
                                <p className="text-xs text-gray-400">
                                  {child.slug}
                                  {childProductCount > 0 && (
                                    <span className="ml-2">
                                      · {childProductCount}{" "}
                                      {childProductCount === 1
                                        ? "producto"
                                        : "productos"}
                                    </span>
                                  )}
                                </p>
                              </div>
                              <DeleteCategoryButton
                                categoryId={child.id}
                                categoryName={child.name}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
