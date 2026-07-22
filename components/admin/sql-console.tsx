"use client";

import { useEffect, useState } from "react";

// Consola SQL solo-SELECT del backoffice (patrón ConsultasClient de SUK).
// La seguridad real vive en el server: guard admin-only + blacklist en
// /api/admin/queries/execute + RPC revocada a anon (solo service role).

type SavedQuery = {
  id: string;
  nombre: string;
  descripcion: string | null;
  sql_query: string;
  created_at: string;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

export default function SqlConsole() {
  const [queries, setQueries] = useState<SavedQuery[]>([]);
  const [sql, setSql] = useState("");
  const [results, setResults] = useState<Row[] | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState("");

  const [showSave, setShowSave] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saveName, setSaveName] = useState("");
  const [saveDesc, setSaveDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadQueries() {
    const res = await fetch("/api/admin/queries");
    if (res.ok) setQueries(await res.json());
  }
  useEffect(() => {
    loadQueries();
  }, []);

  async function execute() {
    if (!sql.trim()) return;
    setExecuting(true);
    setError("");
    setResults(null);
    setColumns([]);
    try {
      const res = await fetch("/api/admin/queries/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql: sql.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al ejecutar");
        return;
      }
      const rows: Row[] = data.rows || [];
      setResults(rows);
      if (rows.length > 0) setColumns(Object.keys(rows[0]));
    } catch {
      setError("Error de conexión");
    } finally {
      setExecuting(false);
    }
  }

  async function handleSave() {
    if (!saveName.trim() || !sql.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/queries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingId || undefined,
        nombre: saveName.trim(),
        descripcion: saveDesc.trim(),
        sql_query: sql.trim(),
      }),
    });
    if (res.ok) {
      setShowSave(false);
      setEditingId(null);
      setSaveName("");
      setSaveDesc("");
      await loadQueries();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/queries?id=${id}`, { method: "DELETE" });
    setDeletingId(null);
    await loadQueries();
  }

  function exportCsv() {
    if (!results || results.length === 0) return;
    // Mismo csvCell anti CSV/formula injection que /api/admin/export.
    const esc = (v: unknown) => {
      let s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
      if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
      return `"${s.replace(/"/g, '""')}"`;
    };
    const lines = [
      columns.map(esc).join(","),
      ...results.map((r) => columns.map((c) => esc(r[c])).join(",")),
    ];
    const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "consulta_nalika.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold text-ink">Consultas SQL</h1>
        <p className="text-sm text-ink/50">
          Consultas de solo lectura (SELECT) sobre la base. Solo admins · cada ejecución queda
          auditada.
        </p>
        <p className="mt-1 inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
          Solo lectura · máx 5000 filas · timeout 5s
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Guardadas */}
        <aside className="grid h-fit gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink/40">Guardadas</h2>
          {queries.length === 0 && <p className="text-sm text-ink/40">No hay consultas guardadas.</p>}
          {queries.map((q) => (
            <div key={q.id} className="rounded-xl border border-black/5 bg-white p-3">
              <button
                onClick={() => {
                  setSql(q.sql_query);
                  setResults(null);
                  setError("");
                }}
                className="block w-full text-left"
              >
                <p className="truncate text-sm font-semibold text-ink">{q.nombre}</p>
                {q.descripcion && <p className="truncate text-xs text-ink/50">{q.descripcion}</p>}
              </button>
              <div className="mt-2 flex gap-2">
                {deletingId === q.id ? (
                  <>
                    <button onClick={() => handleDelete(q.id)} className="text-xs font-semibold text-red-600 hover:underline">
                      ¿Eliminar?
                    </button>
                    <button onClick={() => setDeletingId(null)} className="text-xs text-ink/50 hover:text-ink">
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditingId(q.id);
                        setSaveName(q.nombre);
                        setSaveDesc(q.descripcion || "");
                        setSql(q.sql_query);
                        setShowSave(true);
                      }}
                      className="text-xs text-ink/50 hover:text-brand"
                    >
                      Editar
                    </button>
                    <button onClick={() => setDeletingId(q.id)} className="text-xs text-red-600 hover:underline">
                      Eliminar
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </aside>

        {/* Editor + resultados */}
        <div className="grid gap-4">
          <div>
            <textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") execute();
              }}
              rows={6}
              placeholder="SELECT * FROM orders ORDER BY created_at DESC LIMIT 20;"
              className="w-full rounded-xl border border-black/10 bg-white p-3 font-mono text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              spellCheck={false}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={execute}
                disabled={executing}
                className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
              >
                {executing ? "Ejecutando…" : "Ejecutar (Ctrl+Enter)"}
              </button>
              <button
                onClick={() => {
                  setEditingId(null);
                  setSaveName("");
                  setSaveDesc("");
                  setShowSave(true);
                }}
                disabled={!sql.trim()}
                className="rounded-full border border-black/10 px-5 py-2 text-sm font-medium text-ink/70 hover:border-brand disabled:opacity-50"
              >
                Guardar consulta
              </button>
              {results && results.length > 0 && (
                <button
                  onClick={exportCsv}
                  className="rounded-full border border-black/10 px-5 py-2 text-sm font-medium text-ink/70 hover:border-brand"
                >
                  Exportar CSV
                </button>
              )}
            </div>
          </div>

          {showSave && (
            <div className="rounded-xl border border-black/5 bg-white p-4">
              <p className="mb-2 text-sm font-semibold text-ink">
                {editingId ? "Editar consulta" : "Guardar consulta"}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Nombre *"
                  className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand"
                />
                <input
                  value={saveDesc}
                  onChange={(e) => setSaveDesc(e.target.value)}
                  placeholder="Descripción"
                  className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                >
                  {saving ? "Guardando…" : "Guardar"}
                </button>
                <button
                  onClick={() => setShowSave(false)}
                  className="rounded-full border border-black/10 px-4 py-1.5 text-sm text-ink/70"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

          {results && (
            <div>
              <p className="mb-2 text-xs text-ink/40">
                {results.length} fila{results.length === 1 ? "" : "s"}
              </p>
              {results.length === 0 ? (
                <p className="text-sm text-ink/50">Sin resultados.</p>
              ) : (
                <div className="max-h-[60vh] overflow-auto rounded-xl border border-black/5 bg-white">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-cloud">
                      <tr>
                        {columns.map((c) => (
                          <th key={c} className="whitespace-nowrap px-3 py-2 font-semibold text-ink/70">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, i) => (
                        <tr key={i} className="border-t border-black/5">
                          {columns.map((c) => (
                            <td key={c} className="max-w-xs truncate px-3 py-2 text-ink/80">
                              {r[c] == null
                                ? ""
                                : typeof r[c] === "object"
                                  ? JSON.stringify(r[c])
                                  : String(r[c])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
