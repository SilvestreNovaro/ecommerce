import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { getBankInfo, whatsappLink } from "@/lib/bank";

type Props = {
  searchParams: Promise<{ order?: string }>;
};

export default async function ConfirmacionPage({ searchParams }: Props) {
  const { order: orderId } = await searchParams;
  if (!orderId) redirect("/");

  // RLS: el cliente solo puede leer sus propias órdenes.
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, total, payment_method, payment_status, fulfillment, customer_name")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) redirect("/");

  const bank = getBankInfo();
  const wa = whatsappLink(
    `Hola! Te mando el comprobante del pedido #${order.order_number} de Nalika 🐾`
  );

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <div className="text-5xl">🐾</div>
        <h1 className="mt-2 text-3xl font-bold">¡Pedido recibido!</h1>
        <p className="mt-2 text-gray-600">
          Tu número de pedido es{" "}
          <span className="text-xl font-bold">#{order.order_number}</span>
        </p>
        <p className="mt-1 font-semibold">{formatPrice(Number(order.total))}</p>
      </div>

      {order.payment_status === "pending" && order.payment_method === "transfer" && (
        <div className="mt-8 rounded-lg border bg-gray-50 p-6">
          <h2 className="font-bold">Datos para transferir</h2>
          <dl className="mt-3 space-y-1 text-sm">
            <Row label="Titular" value={bank.holder} />
            <Row label="Banco" value={bank.bank} />
            <Row label="CBU" value={bank.cbu} mono />
            <Row label="Alias" value={bank.alias} mono />
            <Row label="CUIT" value={bank.cuit} mono />
          </dl>
          <p className="mt-4 text-sm text-gray-600">
            Transferí el total y mandanos el comprobante por WhatsApp junto con el número de pedido{" "}
            <strong>#{order.order_number}</strong>. Cuando confirmemos el pago, tu pedido entra en
            preparación.
          </p>
          <a
            href={wa}
            target="_blank"
            className="mt-4 inline-block w-full rounded-md bg-green-600 py-3 text-center text-sm font-semibold text-white hover:bg-green-700"
          >
            Enviar comprobante por WhatsApp
          </a>
        </div>
      )}

      <div className="mt-6 rounded-lg border p-4 text-sm text-gray-600">
        {order.fulfillment === "pickup"
          ? "🏠 Retiro: te avisamos por WhatsApp cuando tu pedido esté listo para retirar."
          : "🚚 Envío: coordinamos la entrega y el costo de envío por WhatsApp una vez confirmado el pago."}
      </div>

      <p className="mt-4 text-center text-sm text-gray-500">
        También te enviamos estos datos por email.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/cuenta" className="rounded-md border px-6 py-2 text-center text-sm font-medium hover:bg-gray-50">
          Ver mis pedidos
        </Link>
        <Link
          href="/productos"
          className="rounded-md bg-black px-6 py-2 text-center text-sm font-medium text-white hover:bg-gray-800"
        >
          Seguir comprando
        </Link>
      </div>
    </main>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500">{label}</dt>
      <dd className={`font-medium ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
