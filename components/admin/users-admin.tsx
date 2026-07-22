"use client";

import { useEffect, useState } from "react";
import { useAdminUser } from "@/components/admin/admin-context";
import {
  ASSIGNABLE_SECTIONS,
  DEFAULT_OPERATOR_SECTIONS,
  type AdminUser,
  type SectionKey,
} from "@/lib/permissions";

// Gestión de usuarios del panel (patrón UsuariosPage de SUK).
// El server (/api/admin/users) es quien manda: guards admin-only, validación
// de permisos asignables y anti auto-sabotaje. La UI además deshabilita las
// acciones sobre uno mismo para no chocar contra esas reglas.

type Role = AdminUser["role"];
type PanelUser = AdminUser & { created_at?: string };

const inputCls =
  "w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand";

export default function UsersAdmin() {
  const me = useAdminUser();
  const [users, setUsers] = useState<PanelUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({
    email: "",
    full_name: "",
    password: "",
    role: "operador" as Role,
  });
  const [creating, setCreating] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [pwUser, setPwUser] = useState<PanelUser | null>(null);
  const [ok, setOk] = useState("");

  function showOk(m: string) {
    setOk(m);
    setTimeout(() => setOk(""), 3000);
  }

  async function loadUsers() {
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }
  useEffect(() => {
    loadUsers();
  }, []);

  async function updateUser(id: string, data: Record<string, unknown>) {
    setSaving(id);
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    if (!res.ok) setError((await res.json()).error || "Error al actualizar");
    await loadUsers();
    setSaving(null);
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newForm),
    });
    if (!res.ok) {
      setError((await res.json()).error || "Error al crear usuario");
      setCreating(false);
      return;
    }
    setNewForm({ email: "", full_name: "", password: "", role: "operador" });
    setShowNew(false);
    setCreating(false);
    await loadUsers();
    showOk("Usuario creado");
  }

  function getUserPermissions(user: PanelUser): string[] {
    if (user.role === "admin") return ASSIGNABLE_SECTIONS.map((s) => s.key);
    if (!user.permissions) return [...DEFAULT_OPERATOR_SECTIONS];
    return user.permissions.map((p) => p.replace(":readonly", ""));
  }
  function isReadonly(user: PanelUser, section: string): boolean {
    if (user.role === "admin") return false;
    if (!user.permissions) return false;
    return user.permissions.includes(`${section}:readonly`);
  }
  function toggleSection(user: PanelUser, section: SectionKey) {
    const current = user.permissions || [...DEFAULT_OPERATOR_SECTIONS];
    const hasSection = current.some((p) => p === section || p === `${section}:readonly`);
    const updated = hasSection
      ? current.filter((p) => p !== section && p !== `${section}:readonly`)
      : [...current, section];
    updateUser(user.id, { permissions: updated });
  }
  function toggleReadonly(user: PanelUser, section: SectionKey) {
    const current = user.permissions || [...DEFAULT_OPERATOR_SECTIONS];
    const key = `${section}:readonly`;
    const updated = current.includes(key)
      ? current.map((p) => (p === key ? section : p))
      : current.map((p) => (p === section ? key : p));
    updateUser(user.id, { permissions: updated });
  }

  if (loading)
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-ink/40">
        Cargando…
      </div>
    );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Usuarios del panel</h1>
          <p className="text-sm text-ink/50">Accesos y permisos de administradores y operadores</p>
        </div>
        <button
          onClick={() => setShowNew(!showNew)}
          className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          + Nuevo usuario
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

      {showNew && (
        <form onSubmit={createUser} className="mb-6 rounded-2xl border border-black/5 bg-white p-5">
          <h3 className="mb-4 font-display font-bold text-ink">Crear usuario</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              Email *
              <input
                type="email"
                required
                value={newForm.email}
                onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              Nombre completo
              <input
                type="text"
                value={newForm.full_name}
                onChange={(e) => setNewForm({ ...newForm, full_name: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              Contraseña *
              <input
                type="password"
                required
                minLength={8}
                value={newForm.password}
                onChange={(e) => setNewForm({ ...newForm, password: e.target.value })}
                placeholder="Mínimo 8 caracteres"
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              Rol
              <select
                value={newForm.role}
                onChange={(e) => setNewForm({ ...newForm, role: e.target.value as Role })}
                className={inputCls}
              >
                <option value="operador">Operador</option>
                <option value="admin">Administrador</option>
              </select>
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
            >
              {creating ? "Creando…" : "Crear usuario"}
            </button>
            <button
              type="button"
              onClick={() => setShowNew(false)}
              className="rounded-full border border-black/10 px-5 py-2 text-sm font-medium text-ink/70 hover:border-brand"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <ul className="grid gap-3">
        {users.map((user) => {
          const isMe = user.id === me.id;
          return (
            <li
              key={user.id}
              className={`rounded-2xl border bg-white ${user.active ? "border-black/5" : "border-red-200 opacity-70"}`}
            >
              <div className="flex flex-wrap items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 font-semibold text-brand">
                  {(user.email[0] || "?").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-semibold text-ink">
                      {user.full_name || user.email}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.role === "admin" ? "bg-brand/10 text-brand" : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {user.role === "admin" ? "Admin" : "Operador"}
                    </span>
                    {!user.active && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        Inactivo
                      </span>
                    )}
                    {isMe && (
                      <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-medium text-ink/50">
                        Vos
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm text-ink/50">{user.email}</p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <button
                    onClick={() => updateUser(user.id, { active: !user.active })}
                    disabled={saving === user.id || isMe}
                    title={isMe ? "No podés desactivar tu propia cuenta" : undefined}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-40 ${
                      user.active
                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                        : "bg-save/10 text-save hover:bg-save/20"
                    }`}
                  >
                    {user.active ? "Desactivar" : "Activar"}
                  </button>
                  <button
                    onClick={() => setPwUser(user)}
                    className="rounded-lg border border-black/10 px-3 py-1.5 text-xs text-ink/70 hover:border-brand"
                  >
                    Contraseña
                  </button>
                  <select
                    value={user.role}
                    onChange={(e) => updateUser(user.id, { role: e.target.value })}
                    disabled={saving === user.id || isMe}
                    title={isMe ? "No podés cambiar tu propio rol" : undefined}
                    className="rounded-lg border border-black/10 px-2 py-1.5 text-xs text-ink disabled:opacity-40"
                  >
                    <option value="admin">Admin</option>
                    <option value="operador">Operador</option>
                  </select>
                  {user.role === "operador" && (
                    <button
                      onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                      className="rounded-lg border border-black/10 px-3 py-1.5 text-xs text-ink/70 hover:border-brand"
                    >
                      {expandedUser === user.id ? "Cerrar" : "Permisos"}
                    </button>
                  )}
                </div>
              </div>

              {expandedUser === user.id && user.role === "operador" && (
                <div className="px-4 pb-4">
                  <div className="rounded-lg bg-cloud p-4">
                    <p className="mb-3 text-xs text-ink/50">
                      Secciones accesibles para este operador:
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {ASSIGNABLE_SECTIONS.map((section) => {
                        const perms = getUserPermissions(user);
                        const hasAccess = perms.includes(section.key);
                        const readonly = isReadonly(user, section.key);
                        return (
                          <div key={section.key} className="space-y-1">
                            <label className="flex cursor-pointer items-center gap-2">
                              <input
                                type="checkbox"
                                checked={hasAccess}
                                onChange={() => toggleSection(user, section.key)}
                                className="h-4 w-4 accent-brand"
                              />
                              <span className={`text-sm ${hasAccess ? "text-ink" : "text-ink/40"}`}>
                                {section.emoji} {section.label}
                              </span>
                            </label>
                            {hasAccess && (
                              <label className="ml-6 flex cursor-pointer items-center gap-1.5">
                                <input
                                  type="checkbox"
                                  checked={readonly}
                                  onChange={() => toggleReadonly(user, section.key)}
                                  className="h-3 w-3 accent-amber-500"
                                />
                                <span className="text-xs text-amber-600/80">Solo lectura</span>
                              </label>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {pwUser && (
        <ResetPasswordModal
          user={pwUser}
          onClose={() => setPwUser(null)}
          onDone={(m) => {
            setError("");
            setPwUser(null);
            showOk(m);
          }}
        />
      )}
      {ok && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm text-white shadow-lg">
          {ok}
        </div>
      )}
    </div>
  );
}

function ResetPasswordModal({
  user,
  onClose,
  onDone,
}: {
  user: PanelUser;
  onClose: () => void;
  onDone: (m: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"set" | "email" | null>(null);
  const [error, setError] = useState("");

  async function reset(mode: "set" | "email") {
    setError("");
    if (mode === "set" && password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setBusy(mode);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "set" ? { mode: "set", password } : { mode: "email" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Error al procesar");
        return;
      }
      onDone(
        mode === "set" ? `Contraseña actualizada para ${user.email}` : `Link enviado a ${user.email}`
      );
    } catch {
      setError("Error de red");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-lg font-bold text-ink">Restablecer contraseña</h3>
        <p className="mt-1 truncate text-sm text-ink/50">{user.full_name || user.email}</p>
        {error && <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

        <div className="mt-5">
          <label className="text-sm font-medium text-ink">Definir contraseña nueva</label>
          <p className="mb-2 text-xs text-ink/50">
            El admin la define y se la comunica al usuario. Acceso inmediato.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            placeholder="Mínimo 8 caracteres"
            className={inputCls}
          />
          <button
            onClick={() => reset("set")}
            disabled={busy !== null}
            className="mt-3 w-full rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {busy === "set" ? "Guardando…" : "Setear contraseña"}
          </button>
        </div>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-black/5" />
          <span className="text-xs text-ink/40">o</span>
          <div className="h-px flex-1 bg-black/5" />
        </div>

        <div>
          <label className="text-sm font-medium text-ink">Enviar link por email</label>
          <p className="mb-2 text-xs text-ink/50">
            El usuario configura su propia contraseña. Requiere Resend configurado.
          </p>
          <button
            onClick={() => reset("email")}
            disabled={busy !== null}
            className="w-full rounded-full border border-black/10 px-4 py-2.5 text-sm font-medium text-ink/70 hover:border-brand disabled:opacity-50"
          >
            {busy === "email" ? "Enviando…" : `Enviar link a ${user.email}`}
          </button>
        </div>

        <button
          onClick={onClose}
          disabled={busy !== null}
          className="mt-5 w-full py-2 text-sm text-ink/50 hover:text-ink disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
