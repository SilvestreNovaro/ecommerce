"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { HeroSlide } from "@/components/shop/hero-carousel";

// Banner tipo "franja/header" para páginas internas (más bajo que el hero del
// home). Portado de SUK. Si no hay slides, no renderiza nada → el dueño decide
// por sección activando banners desde el admin.
export default function SectionBanner({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const go = useCallback(
    (i: number) => setIndex((i + slides.length) % slides.length),
    [slides.length]
  );

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (!slides || slides.length === 0) return null;

  return (
    <section className="relative h-44 w-full overflow-hidden sm:h-56 md:h-64">
      {slides.map((s, i) => {
        const hasImg = !!(s.imageDesktop || s.imageMobile);
        const light = s.textLight !== false;
        return (
          <div
            key={i}
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            style={{ background: s.bg || "#16171d" }}
          >
            {hasImg && (
              <>
                {s.imageMobile && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.imageMobile}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover sm:hidden"
                  />
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.imageDesktop || s.imageMobile || ""}
                  alt=""
                  className={`absolute inset-0 h-full w-full object-cover ${
                    s.imageMobile ? "hidden sm:block" : ""
                  }`}
                />
                <div className="absolute inset-0 bg-black/30" />
              </>
            )}
            <div
              className={`relative mx-auto max-w-7xl px-6 text-center ${
                light ? "text-white" : "text-ink"
              }`}
            >
              {s.eyebrow && (
                <p
                  className={`mb-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                    light ? "text-white/80" : "text-ink/60"
                  }`}
                >
                  {s.eyebrow}
                </p>
              )}
              {s.title && (
                <h2 className="text-2xl font-extrabold leading-tight drop-shadow-sm sm:text-3xl">
                  {s.title}
                </h2>
              )}
              {s.subtitle && (
                <p
                  className={`mx-auto mt-1.5 max-w-xl text-sm ${
                    light ? "text-white/90" : "text-ink/70"
                  }`}
                >
                  {s.subtitle}
                </p>
              )}
              {s.ctaLabel && s.ctaHref && (
                <Link
                  href={s.ctaHref}
                  className={`mt-3 inline-block rounded-full px-5 py-2 text-xs font-bold shadow transition-transform hover:scale-105 ${
                    light ? "bg-white text-ink" : "bg-ink text-white"
                  }`}
                >
                  {s.ctaLabel}
                </Link>
              )}
            </div>
          </div>
        );
      })}

      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir al banner ${i + 1}`}
              onClick={() => go(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-5 bg-white" : "w-2 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
