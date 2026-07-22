export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminWithPermission } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";

// Ejecuta una consulta de SOLO LECTURA vía la RPC execute_readonly_query
// (SECURITY DEFINER, revocada a anon/authenticated: solo la llama el server
// con service role, y este endpoint exige admin — "consultas" es ADMIN_ONLY).
// Defensa en profundidad (patrón SUK): normalización anti-comentarios +
// blacklist ampliada acá, y SELECT-only + blacklist + timeout + LIMIT en la RPC.

export async function POST(request: Request) {
  const auth = await verifyAdminWithPermission("consultas");
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { sql } = (await request.json()) as { sql: string };
  if (!sql || !sql.trim()) return NextResponse.json({ error: "SQL vacío" }, { status: 400 });

  // Normalizar (sacar comentarios) para evitar bypass del blacklist.
  const stripped = sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n]*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const normalized = stripped.toUpperCase();

  // Toda ejecución rechazada también queda auditada (con IP, la estampa audit()).
  async function blocked(reason: string, status: number) {
    await audit(auth!, "sql_query_blocked", {
      type: "sql",
      details: { sql: sql.slice(0, 2000), reason },
    });
    return NextResponse.json({ error: reason }, { status });
  }

  const forbidden = [
    "DROP ",
    "DELETE ",
    "TRUNCATE ",
    "ALTER ",
    "CREATE ",
    "INSERT ",
    "UPDATE ",
    "GRANT ",
    "REVOKE ",
    "EXECUTE ",
    "CALL ",
    "SET ",
    "COPY ",
  ];
  for (const k of forbidden) {
    if (normalized.includes(k)) return blocked(`Operación no permitida: ${k.trim()}. Solo SELECT.`, 403);
  }
  const dangerousFns = ["PG_SLEEP", "DBLINK", "LO_IMPORT", "LO_EXPORT", "PG_READ_FILE", "PG_WRITE_FILE"];
  for (const fn of dangerousFns) {
    if (normalized.includes(fn)) return blocked(`Función no permitida: ${fn}`, 403);
  }
  if (!normalized.startsWith("SELECT") && !normalized.startsWith("WITH")) {
    return blocked("Solo se permiten consultas SELECT o WITH (CTE).", 403);
  }

  // La RPC envuelve la query en un subselect con LIMIT 5000: un ";" final la rompería.
  const cleanSql = sql.trim().replace(/;+\s*$/, "");

  const db = createAdminClient();
  try {
    const { data, error } = await db.rpc("execute_readonly_query", { query_text: cleanSql });
    if (error) {
      if (error.message.includes("execute_readonly_query") || error.message.includes("does not exist")) {
        return NextResponse.json(
          { error: "Falta la función execute_readonly_query. Aplicá la migración 20260722160000." },
          { status: 500 }
        );
      }
      return NextResponse.json({ error: `Error SQL: ${error.message}` }, { status: 400 });
    }
    const rows = (data || []) as unknown[];
    // Auditoría: TODA ejecución queda registrada (await para no perderla en serverless).
    await audit(auth, "sql_query_executed", {
      type: "sql",
      details: { sql: sql.slice(0, 2000), rows: rows.length },
    });
    return NextResponse.json({ rows, count: rows.length });
  } catch (err) {
    return NextResponse.json(
      { error: `Error: ${err instanceof Error ? err.message : "desconocido"}` },
      { status: 500 }
    );
  }
}
