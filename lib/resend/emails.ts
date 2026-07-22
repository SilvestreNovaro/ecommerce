import "server-only";
import { Resend } from "resend";
import { getBankInfo, whatsappLink } from "@/lib/bank";

// Emails transaccionales (Resend, env-gated y fail-open como en SUK).
// Sin dominio propio todavía: manda desde onboarding@resend.dev.

const FROM = process.env.RESEND_FROM || "Nalika <onboarding@resend.dev>";

type OrderEmailInput = {
  to: string;
  orderNumber: number;
  customerName: string;
  total: number;
  fulfillment: "pickup" | "delivery";
  items: { name: string; quantity: number }[];
};

const money = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

export async function sendOrderConfirmation(input: OrderEmailInput): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return; // env-gated

  const bank = getBankInfo();
  const itemsHtml = input.items
    .map((it) => `<li>${escapeHtml(it.name)} ×${it.quantity}</li>`)
    .join("");
  const wa = whatsappLink(`Hola! Te mando el comprobante del pedido #${input.orderNumber} de Nalika 🐾`);

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#16171d">
      <h1 style="font-size:20px">🐾 ¡Gracias por tu compra, ${escapeHtml(input.customerName)}!</h1>
      <p>Recibimos tu pedido <strong>#${input.orderNumber}</strong>.</p>
      <ul>${itemsHtml}</ul>
      <p><strong>Total: ${money(input.total)}</strong></p>
      <div style="background:#f6f6f9;border-radius:12px;padding:16px;margin:16px 0">
        <p style="margin:0 0 8px"><strong>Datos para transferir:</strong></p>
        <p style="margin:0">Titular: ${escapeHtml(bank.holder)}</p>
        <p style="margin:0">Banco: ${escapeHtml(bank.bank)}</p>
        <p style="margin:0">CBU: ${bank.cbu}</p>
        <p style="margin:0">Alias: ${escapeHtml(bank.alias)}</p>
      </div>
      <p>Cuando transfieras, mandanos el comprobante por WhatsApp junto con el número de pedido
        <strong>#${input.orderNumber}</strong>.</p>
      <p><a href="${wa}" style="display:inline-block;background:#16a34a;color:#fff;padding:10px 20px;border-radius:999px;text-decoration:none;font-weight:bold">Enviar comprobante por WhatsApp</a></p>
      <p style="margin-top:16px">${
        input.fulfillment === "pickup"
          ? "Te avisamos cuando tu pedido esté listo para retirar."
          : "Coordinamos el envío por WhatsApp una vez confirmado el pago."
      }</p>
      <p style="color:#888;font-size:12px;margin-top:24px">Este es un correo automático, por favor no responder.</p>
    </div>`;

  try {
    const resend = new Resend(key);
    await resend.emails.send({
      from: FROM,
      to: input.to,
      subject: `Pedido #${input.orderNumber} recibido — Nalika 🐾`,
      html,
    });
  } catch {
    // fail-open: el email nunca rompe el checkout
  }
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return; // env-gated

  try {
    const resend = new Resend(key);
    await resend.emails.send({
      from: FROM,
      to,
      subject: "¡Bienvenido a Nalika! 🐾",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#16171d">
          <h1 style="font-size:20px">🐾 ¡Hola, ${escapeHtml(name)}!</h1>
          <p>Tu cuenta en <strong>Nalika</strong> quedó creada. Ya podés comprar todo lo que tu mascota necesita.</p>
          <p style="color:#888;font-size:12px;margin-top:24px">Este es un correo automático, por favor no responder.</p>
        </div>`,
    });
  } catch {
    // fail-open
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
