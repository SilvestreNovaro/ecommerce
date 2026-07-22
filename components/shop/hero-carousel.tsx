"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export type HeroSlide = {
  eyebrow?: string | null;
  title?: string | null;
  subtitle?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  imageDesktop?: string | null;
  imageMobile?: string | null;
  bg?: string | null;
  textLight?: boolean;
};

// Carrusel hero full-viewport de la home (portado de SUK). Autoplay 5s +
// flechas + dots. Art direction: imagen mobile (vertical) en <sm, desktop
// (apaisada) en sm+; si no hay imagen, fondo CSS `bg`. Si no hay slides, la
// home directamente no lo renderiza.
export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
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

  if (slides.length === 0) return null;

  return (
    <section className="relative h-[calc(100svh-var(--nav-h))] w-full overflow-hidden">
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
            {/* Imagen de fondo (desktop / mobile) */}
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

            {/* Contenido */}
            <div
              className={`relative mx-auto max-w-7xl px-6 text-center ${
                light ? "text-white" : "text-ink"
              }`}
            >
              {s.eyebrow && (
                <p
                  className={`mb-3 text-sm font-semibold uppercase tracking-[0.2em] ${
                    light ? "text-white/80" : "text-ink/60"
                  }`}
                >
                  {s.eyebrow}
                </p>
              )}
              {s.title && (
                <h1 className="text-4xl font-extrabold leading-tight drop-shadow-sm sm:text-6xl">
                  {s.title}
                </h1>
              )}
              {s.subtitle && (
                <p
                  className={`mx-auto mt-4 max-w-xl text-base sm:text-lg ${
                    light ? "text-white/90" : "text-ink/70"
                  }`}
                >
                  {s.subtitle}
                </p>
              )}
              {s.ctaLabel && s.ctaHref && (
                <Link
                  href={s.ctaHref}
                  className={`mt-8 inline-block rounded-full px-8 py-3 text-sm font-bold shadow-lg transition-transform hover:scale-105 ${
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
        <>
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => go(index - 1)}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur transition-colors hover:bg-white/40"
          >
            <Chevron dir="left" />
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            onClick={() => go(index + 1)}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur transition-colors hover:bg-white/40"
          >
            <Chevron dir="right" />
          </button>
          <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ir al slide ${i + 1}`}
                onClick={() => go(i)}
                className={`h-2.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-white" : "w-2.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {dir === "left" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
    </svg>
  );
}
