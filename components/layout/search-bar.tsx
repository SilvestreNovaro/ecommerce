"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";

type Suggestion = {
  products: { name: string; slug: string; image_url: string | null; price: number; promo_price: number | null }[];
  categories: { name: string; slug: string }[];
};

const EMPTY: Suggestion = { products: [], categories: [] };

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false); // mobile expand
  const [sug, setSug] = useState<Suggestion>(EMPTY);
  const [showSug, setShowSug] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Sugerencias con debounce (250ms) + abort.
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setSug(EMPTY);
      return;
    }
    const controller = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : EMPTY))
        .then((data) => {
          setSug(data);
          setHighlight(-1);
        })
        .catch(() => {});
    }, 250);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query]);

  // Cerrar el dropdown al clickear afuera.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setShowSug(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const flat = [
    ...sug.categories.map((c) => ({ type: "cat" as const, href: `/productos?category=${c.slug}`, label: c.name })),
    ...sug.products.map((p) => ({ type: "prod" as const, href: `/productos/${p.slug}`, label: p.name })),
  ];
  const hasSug = flat.length > 0;

  function goSearch() {
    if (!query.trim()) return;
    router.push(`/productos?q=${encodeURIComponent(query.trim())}`);
    reset();
  }

  function reset() {
    setQuery("");
    setSug(EMPTY);
    setShowSug(false);
    setOpen(false);
    setHighlight(-1);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (highlight >= 0 && flat[highlight]) {
      router.push(flat[highlight].href);
      reset();
      return;
    }
    goSearch();
  }

  function handleKey(e: React.KeyboardEvent) {
    if (!hasSug || !showSug) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % flat.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h <= 0 ? flat.length - 1 : h - 1));
    } else if (e.key === "Escape") {
      setShowSug(false);
    }
  }

  const dropdown = showSug && query.trim().length >= 2 && (
    <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-sand bg-white shadow-xl">
      {!hasSug ? (
        <p className="px-4 py-3 text-sm text-ink/50">Sin resultados para “{query.trim()}” 🐾</p>
      ) : (
        <ul className="max-h-96 overflow-y-auto py-1">
          {sug.categories.map((c, i) => (
            <li key={`c-${c.slug}`}>
              <Link
                href={`/productos?category=${c.slug}`}
                onClick={reset}
                className={`flex items-center gap-3 px-4 py-2 text-sm ${highlight === i ? "bg-cream" : "hover:bg-cream"}`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand">📁</span>
                <span className="text-ink/80">
                  Categoría: <strong>{c.name}</strong>
                </span>
              </Link>
            </li>
          ))}
          {sug.products.map((p, i) => {
            const idx = sug.categories.length + i;
            const current = p.promo_price && p.promo_price < p.price ? p.promo_price : p.price;
            return (
              <li key={`p-${p.slug}`}>
                <Link
                  href={`/productos/${p.slug}`}
                  onClick={reset}
                  className={`flex items-center gap-3 px-4 py-2 ${highlight === idx ? "bg-cream" : "hover:bg-cream"}`}
                >
                  {p.image_url ? (
                    <Image src={p.image_url} alt="" width={36} height={36} className="rounded-lg border border-sand object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-dashed border-sand">🐾</span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">{p.name}</span>
                  <span className="shrink-0 text-sm font-semibold text-ink">{formatPrice(current)}</span>
                </Link>
              </li>
            );
          })}
          <li className="border-t border-sand">
            <button
              type="button"
              onClick={goSearch}
              className="w-full px-4 py-2.5 text-center text-sm font-semibold text-brand hover:bg-cream"
            >
              Ver todos los resultados de “{query.trim()}”
            </button>
          </li>
        </ul>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop: buscador ancho con sugerencias */}
      <div ref={boxRef} className="relative hidden w-full max-w-xl md:block">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSug(true);
            }}
            onFocus={() => setShowSug(true)}
            onKeyDown={handleKey}
            placeholder="¿Qué busca tu mascota?"
            className="h-11 w-full rounded-full border border-sand bg-cream pl-5 pr-12 text-sm text-ink placeholder:text-ink/40 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 transition-colors"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand-dark"
            aria-label="Buscar"
          >
            <SearchIcon className="h-4 w-4" strokeWidth={2} />
          </button>
        </form>
        {dropdown}
      </div>

      {/* Mobile: lupa que expande el input (con las mismas sugerencias) */}
      <div className="relative md:hidden">
        {open ? (
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSug(true);
              }}
              placeholder="Buscar…"
              autoFocus
              className="w-40 rounded-full border border-sand bg-cream px-3 py-1.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
            <button type="button" onClick={reset} className="text-ink/40 hover:text-ink" aria-label="Cerrar búsqueda">
              ✕
            </button>
            {showSug && query.trim().length >= 2 && (
              <div className="fixed inset-x-3 top-[70px] z-50">{dropdown}</div>
            )}
          </form>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-black/5"
            aria-label="Buscar"
          >
            <SearchIcon className="h-5 w-5" strokeWidth={1.5} />
          </button>
        )}
      </div>
    </>
  );
}

function SearchIcon({ className, strokeWidth }: { className: string; strokeWidth: number }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={strokeWidth} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
      />
    </svg>
  );
}
