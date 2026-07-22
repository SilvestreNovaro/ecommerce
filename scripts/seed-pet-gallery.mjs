// Seed de la Galería Mascotas: genera 6 imágenes placeholder SVG 800×800
// (fondo pastel de la paleta Nalika + isotipo huella-corazón en blanco +
// nombre de la mascota) — no hay fotos reales de clientes todavía — las sube
// al bucket `pet-gallery` e inserta las 6 filas activas en `pet_photos`.
// Idempotente: si ya existe una foto con el mismo alt, la saltea.
// Uso: node scripts/seed-pet-gallery.mjs
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

const BUCKET = "pet-gallery";

// Nombre visible (para el SVG) + alt (fila en DB) + fondo pastel de la paleta
// (terracota suave / arena — el isotipo blanco tiene que leerse encima).
const PETS = [
  { name: "Luna", alt: "Luna 🐱", bg: "#eda28d" }, // brand-light
  { name: "Toby", alt: "Toby 🐶", bg: "#d9a08a" },
  { name: "Michi", alt: "Michi", bg: "#c9967e" },
  { name: "Rocco", alt: "Rocco", bg: "#dcb6a2" },
  { name: "Frida", alt: "Frida", bg: "#d3a893" },
  { name: "Simón", alt: "Simón", bg: "#c8a28e" }, // arena tostada
];

// Isotipo PawHeart (mismo path que components/logo.tsx), en blanco, centrado.
const HEART_PATH =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

function petSvg({ name, bg }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <rect width="800" height="800" fill="${bg}"/>
  <g fill="#ffffff" transform="translate(208 140) scale(8)">
    <ellipse cx="12.7" cy="15.1" rx="4.8" ry="5.8" transform="rotate(-25 12.7 15.1)"/>
    <ellipse cx="24" cy="10.8" rx="5" ry="6"/>
    <ellipse cx="35.3" cy="15.1" rx="4.8" ry="5.8" transform="rotate(25 35.3 15.1)"/>
    <g transform="translate(10.6 20.1) scale(1.12)">
      <path d="${HEART_PATH}"/>
    </g>
  </g>
  <text x="400" y="690" text-anchor="middle" fill="#ffffff" font-family="'Baloo 2', 'Trebuchet MS', Verdana, sans-serif" font-size="72" font-weight="600">${name}</text>
</svg>
`;
}

function slugify(s) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  let inserted = 0;
  for (let i = 0; i < PETS.length; i++) {
    const pet = PETS[i];
    const { data: existing, error: qErr } = await db
      .from("pet_photos")
      .select("id")
      .eq("alt", pet.alt)
      .maybeSingle();
    if (qErr) throw new Error(`consulta "${pet.alt}": ${qErr.message}`);
    if (existing) {
      console.log(`= "${pet.alt}" ya existe, salteado`);
      continue;
    }

    const svg = Buffer.from(petSvg(pet), "utf8");
    const path = `pet-seed-${slugify(pet.name)}-${Date.now()}.svg`;
    const { error: upErr } = await db.storage
      .from(BUCKET)
      .upload(path, svg, { contentType: "image/svg+xml", cacheControl: "3600", upsert: false });
    if (upErr) throw new Error(`upload "${pet.alt}": ${upErr.message}`);
    const imageUrl = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

    const { error } = await db
      .from("pet_photos")
      .insert({ image_url: imageUrl, alt: pet.alt, orden: i, active: true });
    if (error) throw new Error(`insert "${pet.alt}": ${error.message}`);
    inserted++;
    console.log(`+ "${pet.alt}" subida e insertada (orden ${i})`);
  }

  const { data: rows } = await db
    .from("pet_photos")
    .select("alt, orden, active, image_url")
    .order("orden");
  console.log(`\nListo: ${inserted} fotos insertadas. En DB:`);
  for (const r of rows ?? []) {
    console.log(`  ${r.orden}. ${r.alt} ${r.active ? "(activa)" : "(oculta)"}`);
  }

  // Verificación: la primera imagen responde pública.
  if (rows?.[0]?.image_url) {
    const res = await fetch(rows[0].image_url);
    console.log(`\nCheck imagen pública: ${res.status} ${res.headers.get("content-type")}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
