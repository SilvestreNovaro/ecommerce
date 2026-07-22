"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Carrusel de cards para mobile/tablet (port de SUK; en desktop las secciones
 * muestran grilla).
 * - Autoplay con tiempo configurable + transición suave por transform.
 * - Se pausa al pasar el mouse o tocar, y respeta prefers-reduced-motion.
 * - Flechas + dots de control. Avanza de a una card.
 */
export default function CardCarousel({
  items,
  ariaLabel,
  interval = 3500,
}: {
  items: React.ReactNode[];
  ariaLabel: string;
  interval?: number;
}) {
  const [cardsPerView, setCardsPerView] = useState(1);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Cards por vista según ancho (este carrusel solo se ve por debajo de md/768px).
  useEffect(() => {
    const compute = () => setCardsPerView(window.innerWidth >= 640 ? 2 : 1);
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  const maxIndex = Math.max(0, items.length - cardsPerView);

  // Reajusta el índice si cambia la cantidad de cards visibles.
  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex]);

  const go = useCallback(
    (i: number) => {
      if (i < 0) setIndex(maxIndex);
      else if (i > maxIndex) setIndex(0);
      else setIndex(i);
    },
    [maxIndex]
  );

  // Autoplay (pausado en hover/touch o si el usuario pidió menos movimiento).
  useEffect(() => {
    if (paused) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const t = setInterval(() => setIndex((i) => (i >= maxIndex ? 0 : i + 1)), interval);
    return () => clearInterval(t);
  }, [paused, maxIndex, interval]);

  const step = 100 / cardsPerView;

  return (
    <div
      className="relative"
      role="region"
      aria-roledescription="carrusel"
      aria-label={ariaLabel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * step}%)` }}
        >
          {items.map((item, i) => (
            <div key={i} className="flex-none px-2" style={{ width: `${step}%` }}>
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Flechas */}
      <button
        type="button"
        aria-label="Anterior"
        onClick={() => go(index - 1)}
        className="absolute left-1 top-[42%] z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-ink shadow-md backdrop-blur transition-colors hover:bg-white"
      >
        <Chevron dir="left" />
      </button>
      <button
        type="button"
        aria-label="Siguiente"
        onClick={() => go(index + 1)}
        className="absolute right-1 top-[42%] z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-ink shadow-md backdrop-blur transition-colors hover:bg-white"
      >
        <Chevron dir="right" />
      </button>

      {/* Dots */}
      <div className="mt-4 flex justify-center gap-2">
        {Array.from({ length: maxIndex + 1 }, (_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Ir a la posición ${i + 1}`}
            onClick={() => go(i)}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-5 bg-brand" : "w-2 bg-ink/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      width="20"
      height="20"
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
