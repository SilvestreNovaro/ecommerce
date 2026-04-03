type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ProductoDetallePage({ params }: Props) {
  const { slug } = await params;

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Producto: {slug}</h1>
      {/* TODO: detalle del producto */}
    </main>
  );
}
