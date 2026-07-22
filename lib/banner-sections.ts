// Secciones del sitio donde puede ir un banner (páginas internas). Módulo PURO
// (lo usan el admin client + el server). El dueño activa banners por sección
// cuando quiere; si una sección no tiene banner activo, no se muestra nada.
export const BANNER_SECTIONS = [
  { value: "home", label: "Inicio (hero full-viewport)", path: "/" },
  { value: "productos", label: "Productos (franja superior)", path: "/productos" },
  { value: "galeria", label: "Galería Mascotas (franja superior)", path: "/galeria" },
] as const;

export type BannerSection = (typeof BANNER_SECTIONS)[number]["value"];

export const BANNER_SECTION_VALUES = BANNER_SECTIONS.map((s) => s.value) as readonly string[];

export function bannerSectionLabel(value: string): string {
  return BANNER_SECTIONS.find((s) => s.value === value)?.label ?? value;
}
