"use client";

export function CategoryForm({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="flex gap-3">
      <input
        name="name"
        type="text"
        required
        placeholder="Nombre de la categoría"
        className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
      />
      <button
        type="submit"
        className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        Crear
      </button>
    </form>
  );
}
