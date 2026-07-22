import { NextResponse } from "next/server";
import { quoteCart } from "@/lib/quote";

export const runtime = "nodejs";

// Cotiza el carrito SERVER-SIDE (precios de lista + ofertas + promociones +
// descuento por transferencia). El carrito y el resumen del checkout muestran
// este desglose; createOrder usa el MISMO cálculo (lib/quote.ts) al cobrar.
export async function POST(req: Request) {
  let body: { items?: { productId?: string; quantity?: number }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const items = (body.items ?? [])
    .filter((i) => i && typeof i.productId === "string")
    .map((i) => ({ productId: i.productId as string, quantity: Number(i.quantity) || 1 }));

  const quote = await quoteCart(items);
  return NextResponse.json(quote);
}
