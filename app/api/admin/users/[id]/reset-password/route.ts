export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminCanWrite } from "@/lib/admin-auth";
import { sendAdminPasswordResetEmail } from "@/lib/resend/emails";
import { audit } from "@/lib/audit";

// POST: resetear la contraseña de un usuario del panel (patrón SUK).
//  - { mode: 'set', password }  → el admin la define directo (inmediato).
//  - { mode: 'email' }          → link de recovery por Resend (env-gated).
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminCanWrite("usuarios");
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body inválido" }, { status: 400 });
  }
  const mode = body.mode === "email" ? "email" : "set";

  const db = createAdminClient();
  const { data: target, error: userError } = await db
    .from("admin_users")
    .select("id, email, full_name")
    .eq("id", id)
    .single();
  if (userError || !target)
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  // ── Modo set: contraseña directa ──
  if (mode === "set") {
    const password = typeof body.password === "string" ? body.password : "";
    if (password.length < 8)
      return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
    const { error } = await db.auth.admin.updateUserById(target.id, { password });
    if (error)
      return NextResponse.json({ error: "Error al actualizar la contraseña" }, { status: 500 });

    await audit(auth, "admin_user_password_reset", {
      type: "admin_user",
      id: target.id,
      details: { email: target.email, method: "set" },
    });
    return NextResponse.json({ ok: true, mode: "set" });
  }

  // ── Modo email: link de recovery (requiere Resend, env-gated) ──
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "El envío por email no está disponible (falta configurar Resend)." },
      { status: 503 }
    );
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nalika.vercel.app";
  const { data: linkData, error: linkError } = await db.auth.admin.generateLink({
    type: "recovery",
    email: target.email,
    options: { redirectTo: `${siteUrl}/admin/login` },
  });
  if (linkError || !linkData?.properties?.action_link) {
    return NextResponse.json({ error: "Error generando el link" }, { status: 500 });
  }

  const sent = await sendAdminPasswordResetEmail(target.email, linkData.properties.action_link);
  if (!sent.ok) {
    return NextResponse.json({ error: "Error al enviar el email", detail: sent.error }, { status: 502 });
  }

  await audit(auth, "admin_user_password_reset", {
    type: "admin_user",
    id: target.id,
    details: { email: target.email, method: "email" },
  });
  return NextResponse.json({ ok: true, mode: "email" });
}
