// Lógica PURA de permisos del backoffice (se usa en cliente y server).
// Replicado de SUK: "seccion" = lectura+escritura · "seccion:readonly" = solo lectura.

export const SECTIONS = [
  { key: "pedidos", label: "Pedidos", emoji: "📦" },
  { key: "catalogo", label: "Catálogo", emoji: "🛍️" },
  { key: "clientes", label: "Clientes", emoji: "👥" },
  { key: "promociones", label: "Promociones", emoji: "🏷️" },
  { key: "banners", label: "Banners", emoji: "🖼️" },
  { key: "galeria", label: "Galería Mascotas", emoji: "🐾" },
  { key: "exportar", label: "Exportar CSV", emoji: "📤" },
  { key: "consultas", label: "Consultas SQL", emoji: "🧮" },
  { key: "usuarios", label: "Usuarios", emoji: "🔑" },
] as const;

export type SectionKey = (typeof SECTIONS)[number]["key"];

// Secciones que un operador NUNCA puede tener (solo rol admin).
export const ADMIN_ONLY_SECTIONS: SectionKey[] = ["usuarios", "consultas"];

// Permisos por defecto de un operador sin `permissions` explícitos.
export const DEFAULT_OPERATOR_SECTIONS: SectionKey[] = ["pedidos", "catalogo", "clientes"];

export type AdminUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "operador";
  permissions: string[] | null;
  active: boolean;
};

function grants(user: AdminUser): string[] {
  if (user.role === "admin") return SECTIONS.map((s) => s.key);
  const perms = user.permissions ?? DEFAULT_OPERATOR_SECTIONS;
  return perms.filter((p) => !ADMIN_ONLY_SECTIONS.includes(p.split(":")[0] as SectionKey));
}

/** ¿Puede VER la sección? (incluye solo-lectura) */
export function hasPermission(user: AdminUser | null, section: SectionKey): boolean {
  if (!user || !user.active) return false;
  if (user.role === "admin") return true;
  if (ADMIN_ONLY_SECTIONS.includes(section)) return false;
  return grants(user).some((p) => p === section || p === `${section}:readonly`);
}

/** ¿Puede ESCRIBIR en la sección? */
export function canWrite(user: AdminUser | null, section: SectionKey): boolean {
  if (!user || !user.active) return false;
  if (user.role === "admin") return true;
  if (ADMIN_ONLY_SECTIONS.includes(section)) return false;
  return grants(user).includes(section);
}
