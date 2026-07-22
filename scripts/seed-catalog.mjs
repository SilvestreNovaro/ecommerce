// Seed del catálogo Nalika: 6 categorías + 12 productos placeholder de pet-shop.
// Idempotente: inserta solo lo que no exista (por slug). Sin imágenes (se cargan
// desde el admin). Uso: node scripts/seed-catalog.mjs
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

const CATEGORIES = [
  { name: "Perros", slug: "perros" },
  { name: "Gatos", slug: "gatos" },
  { name: "Alimento", slug: "alimento" },
  { name: "Juguetes", slug: "juguetes" },
  { name: "Accesorios", slug: "accesorios" },
  { name: "Higiene", slug: "higiene" },
];

// cat = slug de categoría · precios enteros en ARS · stock 5–50
const PRODUCTS = [
  { name: "Alimento Premium Perro Adulto 15kg", cat: "alimento", price: 68900, promo: 59900, stock: 24, featured: true,
    desc: "Alimento balanceado premium para perros adultos de razas medianas y grandes. Con pollo y arroz." },
  { name: "Alimento Gato Esterilizado 7.5kg", cat: "alimento", price: 42500, promo: null, stock: 18, featured: true,
    desc: "Fórmula especial para gatos esterilizados: control de peso y salud urinaria." },
  { name: "Alimento Cachorro Razas Pequeñas 3kg", cat: "alimento", price: 21900, promo: null, stock: 30, featured: false,
    desc: "Croquetas chicas para cachorros de hasta 12 meses. Con DHA para el desarrollo." },
  { name: "Piedras Sanitarias Aglomerantes 10kg", cat: "higiene", price: 12800, promo: 10900, stock: 40, featured: false,
    desc: "Piedritas aglomerantes de secado rápido, con control de olores. Rinde hasta 4 semanas." },
  { name: "Shampoo Perro Pelo Largo 500ml", cat: "higiene", price: 8900, promo: null, stock: 25, featured: false,
    desc: "Shampoo con acondicionador para perros de pelo largo. Aroma suave a avena." },
  { name: "Pelota Kong Clásica Mediana", cat: "juguetes", price: 15400, promo: null, stock: 15, featured: true,
    desc: "Juguete de caucho resistente para perros medianos. Rellenable con snacks." },
  { name: "Ratón de Peluche con Catnip x3", cat: "juguetes", price: 6500, promo: 4900, stock: 35, featured: false,
    desc: "Pack de 3 ratones de peluche con hierba gatera. El favorito de los gatos." },
  { name: "Rascador Torre con Hamaca 60cm", cat: "gatos", price: 54900, promo: 47900, stock: 8, featured: true,
    desc: "Torre rascadora de sisal con hamaca superior y cueva. Ideal departamentos." },
  { name: "Cama Moisés Perro Mediano", cat: "perros", price: 32900, promo: null, stock: 12, featured: false,
    desc: "Cama acolchada lavable con bordes elevados. Para perros de hasta 20kg." },
  { name: "Correa Retráctil 5m Perro Grande", cat: "accesorios", price: 18700, promo: null, stock: 20, featured: false,
    desc: "Correa retráctil con freno y traba, cinta de 5 metros para perros de hasta 50kg." },
  { name: "Comedero Doble Acero Inoxidable", cat: "accesorios", price: 11200, promo: 9500, stock: 28, featured: false,
    desc: "Comedero doble antideslizante de acero inoxidable, fácil de lavar." },
  { name: "Arnés Acolchado Gato con Correa", cat: "gatos", price: 9800, promo: null, stock: 16, featured: false,
    desc: "Arnés escapable-proof con correa incluida, para paseos seguros con tu gato." },
];

const slugify = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

async function main() {
  // Categorías
  const catId = {};
  for (const c of CATEGORIES) {
    const { data: existing } = await db.from("categories").select("id").eq("slug", c.slug).maybeSingle();
    if (existing) {
      catId[c.slug] = existing.id;
      console.log(`= categoría "${c.name}" ya existe`);
      continue;
    }
    const { data, error } = await db.from("categories").insert({ name: c.name, slug: c.slug }).select("id").single();
    if (error) throw new Error(`categoría ${c.name}: ${error.message}`);
    catId[c.slug] = data.id;
    console.log(`+ categoría "${c.name}"`);
  }

  // Productos
  let inserted = 0;
  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = PRODUCTS[i];
    const slug = slugify(p.name);
    const { data: existing } = await db.from("products").select("id").eq("slug", slug).maybeSingle();
    if (existing) {
      console.log(`= producto "${p.name}" ya existe`);
      continue;
    }
    const { error } = await db.from("products").insert({
      name: p.name,
      slug,
      description: p.desc,
      price: p.price,
      promo_price: p.promo,
      category_id: catId[p.cat],
      stock: p.stock,
      active: true,
      featured: p.featured,
      sort_order: i,
    });
    if (error) throw new Error(`producto ${p.name}: ${error.message}`);
    inserted++;
    console.log(`+ producto "${p.name}"`);
  }

  const { count: pc } = await db.from("products").select("id", { count: "exact", head: true });
  const { count: cc } = await db.from("categories").select("id", { count: "exact", head: true });
  console.log(`\nListo: ${inserted} productos insertados. Totales en DB: ${cc} categorías, ${pc} productos.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
