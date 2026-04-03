import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderConfirmation(to: string, orderId: string) {
  return resend.emails.send({
    from: "tienda@tudominio.com",
    to,
    subject: `Confirmación de orden #${orderId}`,
    html: `<h1>¡Gracias por tu compra!</h1><p>Tu orden <strong>#${orderId}</strong> ha sido recibida.</p>`,
  });
}

export async function sendWelcomeEmail(to: string, name: string) {
  return resend.emails.send({
    from: "tienda@tudominio.com",
    to,
    subject: "¡Bienvenido/a a nuestra tienda!",
    html: `<h1>Hola ${name}!</h1><p>Gracias por registrarte. Esperamos que disfrutes tu experiencia.</p>`,
  });
}
