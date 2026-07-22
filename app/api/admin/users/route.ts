export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminCanWrite } from "@/lib/admin-auth";
import { ASSIGNABLE_SECTIONS } from "@/lib/permissions";
import { audit } from "@/lib/audit";

// Gestión de usuarios del panel (patrón SUK). "usuarios" es ADMIN_ONLY →
// solo rol admin pasa los guards. admin_users es RLS deny-all: service role.

// GET: listar usuarios del panel
export async function GET() {
  const auth = await verifyAdminCanWrite("usuarios");
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const db = createAdminClient();
  const { data, error } = await db
    .from("admin_users")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST: crear usuario del panel (auth.users + admin_users, con rollback)
export async function POST(request: Request) {
  const auth = await verifyAdminCanWrite("usuarios");
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { email, full_name, role, password } = body;

  if (!email || !password)
    return NextResponse.json({ error: "Email y contraseña son obligatorios" }, { status: 400 });
  if (password.length < 8)
    return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
  if (role && !["admin", "operador"].includes(role))
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  if (role === "admin" && auth.role !== "admin")
    return NextResponse.json({ error: "Solo administradores pueden crear otros administradores" }, { status: 403 });

  const db = createAdminClient();
  const { data: authUser, error: authError } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError) {
    if (authError.message.includes("already been registered"))
      return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 400 });
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  const { error: insertError } = await db.from("admin_users").insert({
    id: authUser.user.id,
    email,
    full_name: full_name || null,
    role: role || "operador",
    active: true,
  });
  if (insertError) {
    // ROLLBACK: si no pudo entrar a admin_users, el usuario de Auth no queda huérfano.
    await db.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await audit(auth, "admin_user_created", {
    type: "admin_user",
    id: authUser.user.id,
    details: { email, role: role || "operador", full_name },
  });

  return NextResponse.json({ success: true, id: authUser.user.id });
}

// PATCH: actualizar (role, permissions, active, full_name)
export async function PATCH(request: Request) {
  const auth = await verifyAdminCanWrite("usuarios");
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { id, role, permissions, active, full_name } = body;
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  // Anti auto-sabotaje: nadie se desactiva ni se cambia rol/permisos a sí mismo.
  if (id === auth.id) {
    if (active === false)
      return NextResponse.json({ error: "No podés desactivar tu propia cuenta" }, { status: 400 });
    if (role && role !== auth.role)
      return NextResponse.json({ error: "No podés cambiar tu propio rol" }, { status: 400 });
    if (permissions !== undefined)
      return NextResponse.json({ error: "No podés modificar tus propios permisos" }, { status: 400 });
  }
  if (role && !["admin", "operador"].includes(role))
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  // Defensa en profundidad: solo un admin puede promover a admin (el guard ya lo
  // garantiza porque "usuarios" es admin-only, pero lo dejamos explícito).
  if (role === "admin" && auth.role !== "admin")
    return NextResponse.json({ error: "Solo administradores pueden asignar el rol admin" }, { status: 403 });

  if (permissions !== undefined && permissions !== null) {
    if (!Array.isArray(permissions))
      return NextResponse.json({ error: "Permisos debe ser un array" }, { status: 400 });
    const assignable = ASSIGNABLE_SECTIONS.map((s) => s.key as string);
    for (const p of permissions) {
      if (typeof p !== "string")
        return NextResponse.json({ error: "Permiso inválido" }, { status: 400 });
      const base = p.replace(":readonly", "");
      if (!assignable.includes(base))
        return NextResponse.json({ error: `Permiso no asignable: ${base}` }, { status: 400 });
    }
  }

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (role !== undefined) updateData.role = role;
  if (permissions !== undefined) updateData.permissions = permissions;
  if (active !== undefined) updateData.active = active;
  if (full_name !== undefined) updateData.full_name = full_name;

  const db = createAdminClient();
  const { error } = await db.from("admin_users").update(updateData).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await audit(auth, "admin_user_updated", {
    type: "admin_user",
    id,
    details: updateData,
  });

  return NextResponse.json({ success: true });
}
