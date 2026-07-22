export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminWithPermission, verifyAdminCanWrite } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";

// CRUD de consultas guardadas de la consola SQL (patrón SUK).
// "consultas" es sección ADMIN_ONLY → solo rol admin pasa los guards.

// GET: listar consultas guardadas
export async function GET() {
  const auth = await verifyAdminWithPermission("consultas");
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const db = createAdminClient();
  const { data, error } = await db
    .from("saved_queries")
    .select("*")
    .order("orden", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST: crear o actualizar
export async function POST(request: Request) {
  const auth = await verifyAdminCanWrite("consultas");
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, nombre, descripcion, sql_query } = await request.json();
  if (!nombre || !sql_query)
    return NextResponse.json({ error: "Nombre y SQL son obligatorios" }, { status: 400 });

  const db = createAdminClient();
  if (id) {
    const { error } = await db
      .from("saved_queries")
      .update({
        nombre,
        descripcion: descripcion || null,
        sql_query,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await db
      .from("saved_queries")
      .insert({ nombre, descripcion: descripcion || null, sql_query });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await audit(auth, id ? "saved_query_updated" : "saved_query_created", {
    type: "saved_query",
    id,
    details: { nombre },
  });
  return NextResponse.json({ success: true });
}

// DELETE: eliminar
export async function DELETE(request: Request) {
  const auth = await verifyAdminCanWrite("consultas");
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const db = createAdminClient();
  const { error } = await db.from("saved_queries").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await audit(auth, "saved_query_deleted", { type: "saved_query", id });
  return NextResponse.json({ success: true });
}
