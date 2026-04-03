import { Resend } from "resend";

const FROM = "Tienda <onboarding@resend.dev>";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

type OrderEmailItem = {
  name: string;
  quantity: number;
  unit_price: number;
};

export async function sendOrderConfirmation(
  to: string,
  orderId: string,
  items: OrderEmailItem[],
  total: number
) {
  const itemsHtml = items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${item.name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${(item.unit_price * item.quantity).toLocaleString()}</td>
        </tr>`
    )
    .join("");

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Confirmación de orden #${orderId.slice(0, 8)}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h1 style="color:#111">¡Gracias por tu compra!</h1>
        <p>Tu orden <strong>#${orderId.slice(0, 8)}</strong> ha sido recibida y está siendo procesada.</p>
        <table style="width:100%;border-collapse:collapse;margin:24px 0">
          <thead>
            <tr style="border-bottom:2px solid #111">
              <th style="padding:8px;text-align:left">Producto</th>
              <th style="padding:8px;text-align:center">Cant.</th>
              <th style="padding:8px;text-align:right">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding:8px;font-weight:bold">Total</td>
              <td style="padding:8px;text-align:right;font-weight:bold">$${total.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
        <p style="color:#666">Te notificaremos cuando tu pedido sea enviado.</p>
      </div>
    `,
  });
}

export async function sendShippingUpdate(
  to: string,
  orderId: string,
  status: string
) {
  const statusMessages: Record<string, string> = {
    shipped: "Tu pedido ha sido enviado y está en camino.",
    delivered: "Tu pedido ha sido entregado.",
  };

  const message = statusMessages[status] ?? `El estado de tu pedido cambió a: ${status}`;

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Actualización de orden #${orderId.slice(0, 8)}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h1 style="color:#111">Actualización de tu pedido</h1>
        <p>Orden <strong>#${orderId.slice(0, 8)}</strong></p>
        <p>${message}</p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(to: string, name: string) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: "¡Bienvenido/a a nuestra tienda!",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h1 style="color:#111">¡Hola ${name}!</h1>
        <p>Gracias por registrarte en nuestra tienda.</p>
        <p>Ya podés explorar nuestro catálogo y hacer tu primera compra.</p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/productos"
           style="display:inline-block;margin-top:16px;padding:12px 24px;background:#111;color:#fff;text-decoration:none;border-radius:6px">
          Ver productos
        </a>
      </div>
    `,
  });
}
