import Link from "next/link";

type Props = {
  searchParams: Promise<{ order?: string }>;
};

export default async function ConfirmacionPage({ searchParams }: Props) {
  const { order } = await searchParams;

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 text-center">
      <div className="mx-auto max-w-md space-y-4">
        <div className="text-5xl">✓</div>
        <h1 className="text-3xl font-bold">¡Pedido confirmado!</h1>
        {order && (
          <p className="text-gray-500">
            Orden <span className="font-mono font-medium">#{order.slice(0, 8)}</span>
          </p>
        )}
        <p className="text-gray-600">
          Recibirás un email con los detalles de tu pedido.
        </p>
        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-center">
          <Link
            href="/cuenta"
            className="rounded-md border px-6 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Ver mis órdenes
          </Link>
          <Link
            href="/productos"
            className="rounded-md bg-black px-6 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Seguir comprando
          </Link>
        </div>
      </div>
    </main>
  );
}
