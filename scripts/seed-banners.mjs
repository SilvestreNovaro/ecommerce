// Seed de banners reales de la home: sube las 6 imágenes generadas (fuera del
// repo, en C:\Users\joaqu\ecommerce-assets\banners) al bucket `banners` e
// inserta 3 filas en la tabla `banners` (section 'home'). Idempotente: si ya
// existe un banner con el mismo título, lo saltea (no re-sube imágenes).
// Uso: node scripts/seed-banners.mjs
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

// ── .env.local (a mano; ojo con el BOM) ─────────────────────────────────────
const env = {};
const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8").replace(/^﻿/, "");
for (const line of raw.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}
const db = createClient(url, key);

const ASSETS_DIR = "C:/Users/joaqu/ecommerce-assets/banners";
const BUCKET = "banners";

// Los textos de cada fila son coherentes con la imagen generada (las imágenes
// placeholder ya traen el texto pintado; cuando haya banners fotográficos
// reales, estos campos son el overlay). CTA común: Ver productos → /productos.
const BANNERS = [
  {
    desktop: "banner-hero-1-desktop.jpg",
    mobile: "banner-hero-1-mobile.jpg",
    eyebrow: "Bienvenidos a",
    titulo: "Nalika",
    subtitulo: "Todo para tu mascota",
    bg: "linear-gradient(135deg,#14b8a6,#0f766e)", // teal, mismo clima que la imagen
    orden: 1,
  },
  {
    desktop: "banner-hero-2-desktop.jpg",
    mobile: "banner-hero-2-mobile.jpg",
    eyebrow: "Nutrición de calidad",
    titulo: "Alimento premium",
    subtitulo: "Las mejores marcas para tu mejor amigo",
    bg: "linear-gradient(135deg,#d97706,#92400e)", // ámbar
    orden: 2,
  },
  {
    desktop: "banner-hero-3-desktop.jpg",
    mobile: "banner-hero-3-mobile.jpg",
    eyebrow: "Hora de jugar",
    titulo: "Juguetes y accesorios",
    subtitulo: "Para perros y gatos",
    bg: "linear-gradient(135deg,#6366f1,#4338ca)", // índigo
    orden: 3,
  },
];

async function uploadImage(fileName) {
  const buf = readFileSync(resolve(ASSETS_DIR, fileName));
  const ext = fileName.split(".").pop();
  const path = `banner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await db.storage
    .from(BUCKET)
    .upload(path, buf, { contentType: "image/jpeg", cacheControl: "3600", upsert: false });
  if (error) throw new Error(`upload ${fileName}: ${error.message}`);
  return db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

async function main() {
  let inserted = 0;
  for (const b of BANNERS) {
    const { data: existing, error: qErr } = await db
      .from("banners")
      .select("id")
      .eq("section", "home")
      .eq("titulo", b.titulo)
      .maybeSingle();
    if (qErr) throw new Error(`consulta "${b.titulo}": ${qErr.message}`);
    if (existing) {
      console.log(`= banner "${b.titulo}" ya existe, salteado`);
      continue;
    }

    const imageDesktop = await uploadImage(b.desktop);
    const imageMobile = await uploadImage(b.mobile);

    const { error } = await db.from("banners").insert({
      section: "home",
      eyebrow: b.eyebrow,
      titulo: b.titulo,
      subtitulo: b.subtitulo,
      cta_label: "Ver productos",
      cta_href: "/productos",
      image_desktop_url: imageDesktop,
      image_mobile_url: imageMobile,
      bg: b.bg,
      text_light: true,
      orden: b.orden,
      activo: true,
    });
    if (error) throw new Error(`insert "${b.titulo}": ${error.message}`);
    inserted++;
    console.log(`+ banner "${b.titulo}" (desktop + mobile subidos)`);
  }

  const { data: rows } = await db
    .from("banners")
    .select("titulo, orden, activo")
    .eq("section", "home")
    .order("orden");
  console.log(`\nListo: ${inserted} banners insertados. En DB (home):`);
  for (const r of rows ?? []) console.log(`  ${r.orden}. ${r.titulo} ${r.activo ? "(activo)" : "(inactivo)"}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
