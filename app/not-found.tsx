import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="mt-4 text-lg text-gray-600">
        La página que buscás no existe.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-md bg-black px-6 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
