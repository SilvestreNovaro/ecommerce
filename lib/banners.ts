import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { HeroSlide } from "@/components/shop/hero-carousel";

// Banners activos de una sección, mapeados al shape de slide. Lectura pública
// (RLS permite select con la anon key). Si la sección no tiene banners activos,
// devuelve [] y la página no renderiza la franja/hero.
export async function getBannerSlides(section: string): Promise<HeroSlide[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("banners")
    .select(
      "eyebrow, titulo, subtitulo, cta_label, cta_href, image_desktop_url, image_mobile_url, bg, text_light, orden"
    )
    .eq("section", section)
    .eq("activo", true)
    .order("orden", { ascending: true });
  return (data ?? []).map((b) => ({
    eyebrow: b.eyebrow,
    title: b.titulo,
    subtitle: b.subtitulo,
    ctaLabel: b.cta_label,
    ctaHref: b.cta_href,
    imageDesktop: b.image_desktop_url,
    imageMobile: b.image_mobile_url,
    bg: b.bg,
    textLight: b.text_light,
  }));
}
