# CLAUDE.md — Nalika (e-commerce de mascotas)

> **Documento vivo.** TODO cambio, adición o decisión se documenta acá, en el momento en que se hace.
> Si algo de este documento contradice la realidad del código, gana el código y se corrige acá.
> Última actualización: 2026-07-22.

## Qué es Nalika

E-commerce **B2C de productos para mascotas**. Todos los productos son **terminados** (no hay
personalización ni diseño custom — a diferencia de SUK, que tiene diseñador de prendas).
Proyecto conjunto de **Silvestre** (dueño del repo) y **Joaco** (colaborador, usuario GitHub `BrancaStore`).

- **GitHub:** https://github.com/SilvestreNovaro/ecommerce (rama única: `master`)
- **Producción:** https://nalika.vercel.app (Vercel, proyecto `nalika`, team `silvestrenovaros-projects`, plan Hobby)
- **Supabase:** proyecto **"Nalika Web"** (`giutlxlkaotbplnogtlo`, org de Silvestre, plan Free)
- **Emails:** Resend (key cargada en Vercel; dominio propio pendiente)

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4
- Supabase (Postgres + Auth + Storage) vía `@supabase/ssr`
- Vercel con auto-deploy: push a `master` → build → producción. Ramas → preview deployments.
- Resend (emails transaccionales) · Recharts (gráficos admin)

## ⚠️ Reglas de trabajo (fijadas por Joaco, 2026-07-22)

1. **Back y front en paralelo**: cada feature entra completa (DB + admin + tienda), no maquetas huecas.
2. **Cambios importantes = `npm run build` OK → commit + push → auto-deploy. SIN preguntar.**
   Se reporta lo hecho, no se pide permiso.
3. **Todo se documenta en este CLAUDE.md** al momento de hacerse.
4. **SUK es cantera de referencia SOLO LECTURA** (`C:\Users\joaqu\OneDrive\Escritorio\SUK`).
   **PROHIBIDO modificar, crear o borrar cualquier cosa dentro de SUK.** De ahí se replican módulos
   adaptados a Nalika.
5. Donde falte imagen o texto: **placeholder en clave tienda de mascotas** (nunca lorem ipsum genérico).
6. Somos dos laburando: **`git pull` antes de empezar** cada sesión.
7. Mensajes de commit en español, concisos, describiendo el cambio funcional.

## 🎯 PLAN VIGENTE — Rediseño total (definido 2026-07-22)

**El backoffice actual se reemplaza entero.** Se replican de SUK estos módulos, adaptados a Nalika
(la adaptación clave: acá NO hay diseños/archivos de impresión — todos los productos son terminados):

| # | Módulo | Qué se replica de SUK | Estado |
|---|--------|----------------------|--------|
| 1 | **Pedidos** | TODO el flujo actual de SUK: estado de **pago** separado del **logístico**, `order_number` legible, confirmar pago 1-click (pendiente→pagado + recibido→preparación), avanzar estado logístico, cancelar, retiro vs envío con estados propios, filtros por estado/pago, búsqueda por N°/cliente/ID, filtro por fechas. SIN previews/print-files. | ✅ 2026-07-22 |
| 2 | **Catálogo** | Gestión de productos estilo SUK: edición inline de precios en la lista, ordenar arrastrando, duplicar, destacados a dedo (`featured`), galería de imágenes por producto (drag&drop + portada), búsqueda por ID/nombre/slug. | ✅ 2026-07-22 |
| 3 | **Clientes** | Listado + detalle de clientes como SUK. | ✅ 2026-07-22 |
| 4 | **Promociones** | Modelo de precios SUK: `base_price` (normal) + `promo_price` (opcional) + **% descuento por transferencia GLOBAL** (`store_settings`, toggle + % editable en admin). Cálculo único server-side (`lib/pricing.ts`). | ✅ 2026-07-22 |
| 5 | **Banners** | Admin de banners por sección del sitio + bucket `banners` + carrusel hero full-viewport en la home. Specs SUK: desktop **1920×1080**, mobile **1080×1920**. Banners genéricos de mascotas hasta tener reales. | ✅ 2026-07-22 |
| 6 | **Galería Mascotas** | = "Suk Comunidad" renombrado: fotos de clientes/mascotas, admin para subir/ordenar/activar/eliminar, sección en home + página propia. | ✅ 2026-07-22 |
| 7 | **Exportar CSV** | `/admin/exportar` + endpoint de export como SUK (con protección CSV injection). | ✅ 2026-07-22 |
| 8 | **Consultas SQL** | Consola solo-SELECT del admin: RPC `execute_readonly_query` (solo `service_role`, revocada a anon/authenticated), queries guardadas, auditoría. | ✅ 2026-07-22 |
| 9 | **Usuarios** | Roles `admin`/`operador`, tabla `admin_users` (RLS deny-all, acceso solo por service role) + permisos por sección + `audit_logs` + reset de contraseña. | ✅ 2026-07-22 |
| 10 | **UI/UX admin** | Sidebar lateral filtrado por permisos, "Ver sitio", rol visible, **cerrar sesión**, patrones de filtros/búsqueda/paginación de SUK. | ✅ 2026-07-22 — quedó cubierto por el resto de los módulos: sidebar filtrado por permisos + "Ver sitio" + rol + Cerrar sesión están desde la infra admin (módulo 1), y los filtros/búsquedas de SUK ya se replicaron en cada módulo (Pedidos, Catálogo, Clientes, etc.). |

**Front de tienda**: se rediseña en paralelo a medida que entran los módulos (home con hero carrusel de
banners + destacados + galería mascotas, catálogo, detalle, carrito, checkout con doble precio).

**Pendientes de decisión del dueño** (no bloquean): Mercado Pago (SUK lo tiene LIVE; Nalika necesitaría
su propia cuenta/token — mientras tanto, checkout por transferencia + confirmación manual), dominio
propio. ~~Identidad visual~~ ✅ definida 2026-07-22 (ver "Branding").

### Branding (definido 2026-07-22)

Logo elegido por Joaco vía Claude Design: variante **2a "huella-corazón"** (3 almohadillas + corazón
como palma). Wordmark "nalika" en minúsculas, **Baloo 2 SemiBold** (next/font, var `--font-baloo` →
`font-logo`). Paleta: **terracota `#E07A5F`** (brand, con light/dark para hover) + tinta `#16171d` +
crema `#faf6f0` (`cream`) + arena `#e9e4de` (`sand`) + verde ahorro `#16a34a` (se mantiene).
- Componentes en `components/logo.tsx`: `PawHeart` (isotipo, size/color) y `NalikaLogo` (isotipo +
  wordmark, prop `light` para fondos oscuros). Usados en: navbar tienda, sidebar admin, login admin.
- Favicon: `app/icon.svg` (isotipo sobre crema redondeada; `app/favicon.ico` eliminado).
- Los botones `bg-brand` del admin pasaron automáticamente a terracota vía token.
- Fuente original de la elección: `C:\Users\joaqu\Downloads\Nalika Logo.html` (rondas de propuestas).

**2026-07-22 — Pasada de branding en front + contenido de prueba (pedidos de Joaco):**
- Logo agrandado: navbar 38px, sidebar admin 32px, login admin 36px.
- **Footer negro estilo SUK** (`bg-ink`): logo en versión clara, columnas Tienda/Mi cuenta/Contacto
  + botón WhatsApp verde. Hovers en terracota claro.
- **Categorías en la navegación**: barra bajo el header en desktop (fondo `cream`, chips hover
  terracota, solo categorías raíz → `/productos?category=<slug>`) + chips en el menú hamburguesa
  mobile. `--nav-h` ahora es responsive (73px mobile / 118px desktop) para el hero.
- **Tipografía**: se eliminó el `body { font-family: Arial }` legacy → cuerpo en Geist
  (`--font-sans`); `font-display` ahora es **Baloo 2** (600/700, la fuente del logo) para títulos.
- **Paleta terracota esparcida por la tienda**: todos los CTAs/acentos que quedaban en negro
  (`bg-black`, `hover:bg-gray-800`, `border-black`, `focus:ring-black`) pasaron a `brand`/
  `brand-dark` en home, login, registro, carrito, checkout, confirmación, filtros, badge del
  carrito y 404. (Los `bg-black/5` de superficie quedaron, son neutrales.)
- **12 productos seed con imagen**: generadas 800×800 (fondo pastel por categoría + isotipo
  huella-corazón + nombre), subidas a `product-images/seed/`, `products.image_url` +
  `product_images` seteados. Script: `C:\Users\joaqu\ecommerce-assets\gen-product-images.ps1`.
- **Banners v2 SIN doble texto** (pedido de Joaco): regenerados en paleta de marca (terracota /
  crema / salvia) con la patita integrada y el texto pintado SOLO en la imagen; las filas de
  `banners` quedaron con `titulo` vacío (el overlay ya no duplica; se mantiene el CTA). Archivos
  viejos borrados del bucket. Script: `gen-banners-v2.ps1` (misma carpeta de assets).

**2026-07-22 — Correcciones de branding/UX (feedback de Joaco; entraron en el commit `428a920`):**
- **FIX CRÍTICO**: `next.config.ts` permitía imágenes solo del proyecto Supabase VIEJO
  (`cezqge...`) → `next/image` rompía todas las fotos. Ahora apunta a `giutlxlkaotbplnogtlo`.
- **Nav ensamblado en una sola pieza** (chau "triple nav"): fila 1 logo 44px + buscador centrado +
  cuenta/carrito; fila 2 blanca con borde sutil: "Todos los productos" + categorías + Galería.
  `--nav-h`: 77px mobile / 121px desktop.
- **Assets v3 con el SVG vectorial REAL del logo** (los v1/v2 dibujaban la patita con
  círculos/triángulos que se notaban): pipeline HTML + Baloo 2 de Google Fonts → **Chrome headless
  screenshot** (`C:\Users\joaqu\ecommerce-assets\gen-assets-v3.ps1`). Regenerados: 3 banners
  (desktop+mobile, paths `v3-*` en el bucket, filas actualizadas, v2 borrados) y las 12 fotos de
  producto (`product-images/seed2/`, `image_url` + `product_images` actualizados, `seed/` borrado).
- Logo agrandado de verdad: navbar 44 · footer 42 · sidebar admin 38 · login admin 42.
- **Botón flotante de WhatsApp** (`components/shop/whatsapp-button.tsx`) en todo el sitio público.

**2026-07-22 — Lote UX de tienda (pedidos de Joaco en caliente):**
- **Buscador con sugerencias**: `GET /api/search/suggest` (productos activos + categorías, ilike
  escapado, cache 30s) + dropdown con thumb/precio, navegación por flechas/Enter/Esc, "Ver todos
  los resultados". Buscador ancho estilo marketplace (crema/terracota, placeholder "¿Qué busca tu
  mascota?"); se fue el último focus violeta.
- **CartWidget patrón SUK** (`components/layout/cart-widget.tsx`, reemplaza `cart-badge`):
  mini-cart al hover (desktop) + **drawer lateral por portal** al click, con qty ±, eliminar,
  desglose real de `useCartQuote` (promos + transferencia + "Ahorrás $X") y CTAs checkout/carrito.
- **Compra rápida desde la card** (`quick-add-button.tsx` dentro de `ProductCard`): agrega al
  carrito sin entrar al producto, feedback "✓ Agregado", corta en el stock disponible.
- **Sin stock numérico en el front**: detalle muestra "✓ Disponible"/"Agotado", mensajes de
  carrito/checkout sin cantidades. (El stock exacto vive solo en el admin.)
- Home: "Bienvenido a **nalika** 🐾" + subtítulo cálido mascotero.

### Avance del rediseño

**2026-07-22 — Infra admin + Módulo 1 (Pedidos) COMPLETOS:**
- **Migraciones nuevas**: `20260722100000_orders_v2` (modelo de órdenes SUK: payment/logistic
  separados, order_number, retiro/envío, pending_orders para MP futuro; dropea el modelo viejo) y
  `20260722110000_admin_users` (enum `admin_role`, `admin_users` RLS deny-all, `audit_logs`; seed:
  los dos hermanos como admin).
- **Infra admin** (patrón SUK): `lib/permissions.ts` (puro, secciones+roles+readonly),
  `lib/admin-auth.ts` (`getAdminUser` con bootstrap por env `ADMIN_EMAILS`, `requireSection`,
  `requireWrite`, `verifyAdmin*`), `lib/audit.ts` (fail-open), `lib/bank.ts` (env `BANK_*` con
  placeholders + WhatsApp helper).
- **Backoffice nuevo**: el admin viejo se BORRÓ entero (páginas + componentes + reportes/inventario).
  Ahora: `/admin/login` propio (fuera del grupo protegido), `app/admin/(protected)/layout.tsx` con
  sidebar (logo, "Ver sitio", nav filtrado por permisos, email+rol+**Cerrar sesión**), `/admin` →
  redirect a pedidos. Middleware: `/admin/*` sin sesión → `/admin/login`.
- **Pedidos admin**: listado con búsqueda N°/cliente/ID + rango de fechas + chips por estado
  logístico y pago (client-side, últimas 200); detalle con ítems (thumb de producto + lightbox),
  cliente, entrega y acciones: **confirmar pago 1-click** (pending→paid + received→preparing,
  auditado), avanzar logístico (pickup: "Marcar como retirado"), cancelar.
- **Checkout nuevo** (tienda): contacto (teléfono solo números) + retiro/envío (envío: costo NO
  incluido, se coordina por WhatsApp) + pago transferencia (MP deshabilitado "próximamente").
  Server action recalcula precios desde DB, garantiza profile, crea orden vía service role,
  descuenta stock + `stock_movements`, email de confirmación con datos bancarios (fail-open).
  Confirmación muestra N° de pedido + datos de transferencia + CTA WhatsApp. `/cuenta` lista
  pedidos con ambos estados.
- **Tema**: tokens SUK en `globals.css` (`ink/paper/cloud/brand/save`) vía `@theme` de Tailwind 4.
- **Envs nuevas**: `ADMIN_EMAILS` (cargada en Vercel+local). Pendientes de valores reales:
  `BANK_HOLDER/NAME/CBU/ALIAS/CUIT`, `NEXT_PUBLIC_WHATSAPP`, `RESEND_FROM` (hoy placeholders).
- ⚠️ Checkout e2e SIN probar aún: la DB no tiene productos (falta módulo 2 Catálogo).

**2026-07-22 — Separación admin/tienda (patrón SUK, entró en el commit del Catálogo):**
- `app/layout.tsx` raíz quedó SIN chrome (solo fonts + CartProvider + metadata). El sitio público
  tiene Header/Footer en `app/(shop)/layout.tsx`; el backoffice usa su propio chrome. `checkout`,
  `cuenta` y `(auth)` (login/registro) se movieron ADENTRO de `(shop)` (URLs sin cambios).
- Metadata/OG del sitio renombrada: "Nalika — Tienda de mascotas" (antes "Tienda Online").
- Assets listos para el módulo 5: 6 banners placeholder generados (3 diseños × desktop 1920×1080 +
  mobile 1080×1920) en `C:\Users\joaqu\ecommerce-assets\banners` (fuera del repo).

**2026-07-22 — Módulo 2 (Catálogo) COMPLETO:**
- **Migración** `20260722120000_catalog_v2` (aplicada): `products.featured` + `products.sort_order`
  + `products.promo_price` (integer nullable, CHECK > 0; `price` queda como precio normal) y tabla
  `product_images` (galería por producto, FK cascade, `orden`; RLS select público, escritura solo
  service role).
- **Catálogo admin** (`/admin/catalogo` + `[id]`, patrón SUK): listado con thumbnail (🐾 si no hay),
  ID visible, categoría, doble precio (normal tachado + promo en verde), stock, badge Activo/Borrador
  y ⭐ destacado; búsqueda tokenizada por ID/nombre/slug; **edición inline de precios** (✎, valida
  promo < normal); **reordenar con ↑/↓** (persiste `sort_order`); **duplicar** (copia nace borrador
  "(copia)"); "+ Producto" crea borrador y va al editor. Editor con slug auto desde el nombre (hasta
  tocarlo a mano), categoría con subcategorías (`optgroup`), promo con hint, activo/destacado, y
  **galería de imágenes** (`product-images-manager`): multi-upload al bucket `product-images`
  (MIME png/jpg/webp, máx 8MB, sin sharp), reordenar drag o ↑/↓, eliminar (borra del bucket) y la
  primera se sincroniza a `products.image_url` (portada). Server actions en `catalogo/actions.ts`,
  todas con `requireWrite("catalogo")` + `audit()`. **Eliminar con ventas asociadas → desactiva**
  (preserva historial); sin ventas → borra fila + galería del bucket. `confirm-delete-button`
  (confirmación en dos pasos, sin dialog).
- **Seed** `scripts/seed-catalog.mjs` (idempotente por slug, lee `.env.local`): 6 categorías
  (Perros/Gatos/Alimento/Juguetes/Accesorios/Higiene) + 12 productos placeholder de pet-shop
  (4 con promo, 4 featured, stock 5–50, sin imágenes). **Ejecutado: DB con 6 categorías y 12
  productos activos.** La tienda pública sigue andando (columnas nuevas son aditivas; `types/index.ts`
  Product actualizado con `featured/sort_order/promo_price`). ⚠️ El front de tienda todavía NO muestra
  promo_price ni ordena por sort_order — entra con el rediseño del front (módulo 4 Promociones).

**2026-07-22 — Módulo 4 (Promociones + precios) COMPLETO:**
- **Migración** `20260722130000_promotions` (aplicada): enums `promo_tipo`
  (porcentaje/monto_fijo/nxm/cantidad_minima) y `promo_alcance` (**todo/producto/categoria** —
  adaptación vs SUK, que no tiene categorías); tabla `promotions` con CHECKs de coherencia
  tipo↔campos (nxm_paga < nxm_compra, etc.) y RLS select público / escritura solo service role;
  tabla `store_settings` single-row (id=1) con `transfer_discount_pct` (0-90, default 10) +
  `transfer_discount_enabled` (default **false**), seed incluido; y columnas
  `orders.promo_discount` + `orders.transfer_discount` (integer) para el desglose de la orden.
  ⚠️ Todos los montos son **integer en pesos** (Math.round en cada paso, sin decimales).
- **Libs**: `lib/pricing.ts` (`computePrices` puro: normal/current/transfer + hasPromo +
  hasTransferDiscount + promoPct), `lib/promotions.ts` (`getActivePromotions` con ventana de
  fechas + `lineDiscount`: la MEJOR promo por línea, no acumulan, tope = total de línea; alcance
  categoría matchea la categoría del producto **o su padre** → subcategorías heredan),
  `lib/settings.ts` (`getStoreSettings`/`setTransferDiscount`) y `lib/quote.ts` (**`quoteCart`,
  única fuente de verdad del carrito**: la usan `/api/cart/quote` Y `createOrder` — lo que se
  muestra es lo que se cobra).
- **Admin `/admin/promociones`** (patrón SUK): ítem FIJO no eliminable "Descuento por
  transferencia" (toggle + % editable → `store_settings`, auditado) + CRUD de promociones
  (modal con grid de 4 tipos, campos condicionales, alcance todo/producto/categoría con selects,
  fechas opcionales, toggle activo, cards Activas vs Inactivas/Vencidas, eliminar con
  confirmación en dos pasos). `requireWrite("promociones")` + `audit()` en todas las actions.
  Componente `components/admin/promotions-admin.tsx`.
- **Tienda con precios reales** (patrón "solo si hay ahorro real": nada tachado/verde sin
  descuento): `product-card` + detalle `[slug]` muestran normal tachado + vigente + badge
  OFERTA (-X%) + línea verde "Con transferencia: $X" (server components → `computePrices`).
  Listado `/productos` y home ordenan por `sort_order` (home prioriza `featured`).
- **`POST /api/cart/quote`**: recalcula el carrito server-side y devuelve desglose
  `{lines, listSubtotal, subtotal, promoDiscount, transferPct, transferDiscount, totalTransfer,
  total, saving, count}`. Hook cliente `lib/use-cart-quote.ts`; `/carrito` y el resumen del
  checkout muestran unitario tachado, nombre de la promo aplicada, descuentos y "Ahorrás $X"
  (fallback naive del contexto mientras carga).
- **Checkout**: `createOrder` usa `quoteCart` → **decisión de guardado**: `order_items.unit_price`
  = precio final unitario con promo prorrateada por línea (`round((unit*qty - desc)/qty)`) y
  `subtotal` del ítem = ese unitario × qty; `orders.subtotal` = suma post-promos;
  `orders.transfer_discount` = % sobre ese subtotal (el pago es transferencia);
  `orders.total = subtotal - transfer_discount`; `orders.promo_discount` = ahorro promocional
  vs lista (informativo). El detalle de pedido del admin muestra el desglose si hay descuentos.
- **Fix moneda**: `formatPrice` estaba en CLP/es-CL (leftover) → ahora **ARS/es-AR** sin decimales.
- Verificado contra la DB real: seed de `store_settings` OK, CHECKs de `promotions` rechazan
  filas incoherentes, columnas nuevas de `orders` OK. `types/supabase.ts` regenerado.

**2026-07-22 — Módulo 5 (Banners) COMPLETO:**
- **Migración** `20260722140000_banners` (aplicada): tabla `banners` (modelo final de SUK, ya con
  `section` — nace fusionada 0005+0008: section/eyebrow/titulo/subtitulo/cta_label/cta_href/
  image_desktop_url/image_mobile_url/bg CSS fallback/text_light/orden/activo) con RLS select
  público y escritura solo service role; **bucket Storage `banners` público** (insert en
  `storage.buckets` + policy de lectura pública). `types/supabase.ts` regenerado.
- **Secciones fijas** en `lib/banner-sections.ts` (módulo puro): `home` (Inicio, hero
  full-viewport), `productos` (franja superior) y `galeria` (franja superior; la página llega con
  el módulo 6 — la sección ya queda lista en el admin).
- **Admin `/admin/banners`** (patrón BannersClient de SUK → `components/admin/banners-admin.tsx`):
  agrupados por sección con "+ Banner" por sección; card con preview (imagen o fondo CSS), ↑/↓
  orden, toggle activo, editar y eliminar (borra también las imágenes del bucket, con
  `confirm-delete-button`). Modal: selector de sección, **specs visibles** (desktop 1920×1080 ·
  mobile 1080×1920 · JPG/WebP ideal <1MB, aire en el centro), upload desktop+mobile (server action
  al bucket, MIME png/jpg/webp máx 8MB, path `banner-<ts>-<rand>.<ext>`; al reemplazar/quitar borra
  la anterior del bucket), campo `bg` CSS con preview en vivo, eyebrow/título/subtítulo, CTA
  (texto+link), orden, checkboxes texto claro/activo. Todo con `requireWrite("banners")` +
  `audit()` + **validaciones de seguridad replicadas de SUK**: `cta_href` solo rutas internas
  `/...` o `https?://`, y `bg` CSS sanitizado (bloquea `javascript:`, `expression(`, `<`,
  `@import`).
- **Front**: `lib/banners.ts` (`getBannerSlides(section)`, lectura pública con anon client),
  `components/shop/hero-carousel.tsx` (port de SUK: full viewport `100svh - var(--nav-h)`,
  autoplay 5s + flechas + dots, art direction imagen mobile <sm / desktop sm+, overlay negro 30% +
  eyebrow/título/subtítulo/CTA en claro u oscuro según `text_light`, fallback al `bg` CSS) y
  `components/shop/section-banner.tsx` (franja h-44/56/64 para internas). Home: hero arriba de
  todo SOLO si hay banners activos de `home`; `/productos` con la franja de la sección
  `productos`. Para el alto exacto del hero: header de la tienda ahora con **alto fijo 72px** +
  var global `--nav-h: 73px` en `globals.css`.
- **Seed** `scripts/seed-banners.mjs` (idempotente por título, lee `.env.local` tolerando BOM,
  service role): subió las 6 imágenes de `C:\Users\joaqu\ecommerce-assets\banners` al bucket e
  insertó los 3 banners de `home` (Nalika teal / Alimento premium ámbar / Juguetes índigo, orden
  1-3, activos, text_light, CTA "Ver productos" → `/productos`, `bg` gradiente a tono).
  **Ejecutado y verificado**: anon lee los 3 banners, las 6 imágenes responden 200 públicas y la
  home sirve el carrusel. ⚠️ Las imágenes placeholder traen el texto PINTADO adentro, y el overlay
  del hero repite ese texto encima (quedó coherente a propósito) — cuando haya banners
  fotográficos reales, dejar aire en el centro y el overlay hace de texto único; si molesta el
  doble texto mientras tanto, vaciar título/subtítulo desde el admin.

**2026-07-22 — Módulo 6 (Galería Mascotas) COMPLETO:**
- **Migración** `20260722150000_pet_gallery` (aplicada): tabla `pet_photos` (image_url/alt/orden/
  active/created_at) con RLS **select público SOLO de active=true** y escritura solo service role +
  **bucket Storage `pet-gallery` público** (policy de lectura). `types/supabase.ts` regenerado.
- **Admin `/admin/galeria`** (patrón CommunityClient de SUK → `components/admin/pet-gallery-admin.tsx`
  + `galeria/actions.ts`): grid de cards con **multi-upload** al bucket (input multiple, MIME
  png/jpg/webp máx 8MB c/u, nacen activas al final del orden), editar `alt` (descripción/epígrafe,
  guarda onBlur, máx 200), ↑/↓ orden, toggle Activa/Oculta y eliminar con `confirm-delete-button`
  (borra también el archivo del bucket). Todas las actions con `requireWrite("galeria")` + `audit()`.
- **Front**: `lib/pet-gallery.ts` (`getPetPhotos(limit?)`, activas por orden, anon client — la RLS
  ya filtra), `components/shop/card-carousel.tsx` (**port del CardCarousel de SUK**: autoplay 3.5s
  pausable, respeta prefers-reduced-motion, flechas + dots, 1 card <640px / 2 en tablet) y
  `components/shop/pet-gallery.tsx` (sección home sobre fondo `cream`: título "Galería Mascotas 🐾"
  + "Los que ya son parte de la familia Nalika", **grilla 2×3 desktop / carrusel mobile**, CTA
  borde `brand` "Ver toda la galería" → `/galeria`; si no hay fotos activas no renderiza nada).
  Home: la sección va al final, después de destacados (máx 6 fotos). Página `app/(shop)/galeria/`
  con `SectionBanner` (sección `galeria`, ya declarada en `lib/banner-sections.ts`), grilla completa
  con el `alt` como epígrafe (`figcaption`) y metadata "Galería Mascotas".
- **Seed** `scripts/seed-pet-gallery.mjs` (idempotente por `alt`, service role, lee `.env.local`
  tolerando BOM): como no hay fotos reales de clientes, genera **6 SVGs placeholder 800×800**
  (fondo pastel terracota/arena de la paleta + isotipo huella-corazón en blanco + nombre) y los sube
  como `image/svg+xml` al bucket + inserta las 6 filas activas (Luna 🐱, Toby 🐶, Michi, Rocco,
  Frida, Simón). **Ejecutado y verificado**: anon lee las 6 filas vía RLS, la imagen responde 200
  pública, y la home y `/galeria` sirven la sección con las 6 fotos (probado con `next start`).
  Cuando lleguen fotos reales: subirlas desde el admin y eliminar/ocultar las placeholder.

**2026-07-22 — Módulos 3 (Clientes) y 7 (Exportar CSV) COMPLETOS:**
- **Clientes admin** (`/admin/clientes` + `[id]`, patrón SUK, solo lectura): listado desde `profiles`
  **excluyendo** los que están en `admin_users` (usuarios del panel no son clientes), con avatar de
  inicial, nombre/email/teléfono, cantidad de pedidos, **total gastado sin cancelados**
  (`logistic_status='cancelled'` no suma), alta y fecha del último pedido; búsqueda client-side
  tokenizada por nombre/email/teléfono/ID + checkbox "Solo con pedidos" (límite 1000 perfiles).
  Detalle: datos de contacto + stats (pedidos / total s/cancelados) + todos sus pedidos con badges
  de pago y logística (mismos colores/labels que Pedidos, incl. "Retirado" para pickup entregado)
  linkeando a `/admin/pedidos/<id>`. Componente `components/admin/clients-admin-list.tsx`.
- **Exportar CSV** (`/admin/exportar` + `GET /api/admin/export`): página con selector de tipo (dos
  cards Pedidos/Clientes) + rango de fechas (solo aplica a pedidos); el botón navega al endpoint →
  descarga directa. Endpoint con `verifyAdminWithPermission("exportar")` (401 si no), query params
  `type`/`from`/`to`, responde `text/csv` con `Content-Disposition: attachment` y nombre con fecha
  (`pedidos_nalika_*.csv` / `clientes_nalika_*.csv`). Replicado de SUK: **`csvCell()` anti
  CSV/formula injection** (prefijo `'` si la celda arranca con `=`/`+`/`-`/`@`/tab/CR, comillas
  escapadas) + **BOM UTF-8** para Excel. Export **Pedidos** = una fila por ítem (N°, fecha, método
  de pago, estado de pago, estado logístico, entrega, cliente, email, teléfono, producto, cantidad,
  precio unitario, subtotal ítem, total pedido — **sin Talle**, Nalika no tiene talles); export
  **Clientes** = nombre, email, teléfono, pedidos, total gastado (sin cancelados), alta, último
  pedido (excluye `admin_users`).

**2026-07-22 — Módulos 8 (Consultas SQL) y 9 (Usuarios) COMPLETOS — PLAN DE 10 MÓDULOS TERMINADO:**
- **Migración** `20260722160000_sql_console` (aplicada): tabla `saved_queries` (RLS deny-all, solo
  service role) + RPC `execute_readonly_query` que **NACE con el hardening del pentest de SUK**
  (0006+0007 fusionadas): SECURITY DEFINER con `search_path = pg_catalog, public`,
  `statement_timeout 5s`, solo SELECT/WITH por regex + blacklist en la función, `LIMIT 5000`
  forzado (subselect + jsonb_agg) y **REVOKE ALL a public/anon/authenticated + GRANT EXECUTE solo
  a service_role** (en SUK la RPC quedó ejecutable por la anon key → data breach; acá el agujero
  no existió nunca). **Verificado contra la DB real**: anon → `42501 permission denied`, service
  role → 200; `saved_queries` vía anon no devuelve filas. `types/supabase.ts` regenerado.
- **Módulo 8 — `/admin/consultas`** (`components/admin/sql-console.tsx`, patrón ConsultasClient de
  SUK): editor textarea con **Ctrl+Enter ejecuta**, aviso "Solo lectura · máx 5000 filas · timeout
  5s", tabla de resultados scrolleable (sticky header, objetos como JSON), sidebar de consultas
  guardadas (usar/editar/eliminar con confirmación en dos pasos) y **export CSV client-side** con
  el mismo `csvCell` anti formula-injection del export (prefijo `'` a `=+-@`/tab/CR + BOM UTF-8).
  APIs: `/api/admin/queries` (GET lista con `verifyAdminWithPermission`, POST crear/editar y
  DELETE con `verifyAdminCanWrite`, auditadas) y `/api/admin/queries/execute` (POST admin-only —
  "consultas" es ADMIN_ONLY): **normaliza el SQL quitando comentarios `/* */` y `--`** antes de
  chequear, blacklist ampliada (DROP/DELETE/TRUNCATE/ALTER/CREATE/INSERT/UPDATE/GRANT/REVOKE/
  EXECUTE/CALL/SET/COPY + PG_SLEEP/DBLINK/LO_IMPORT/LO_EXPORT/PG_READ_FILE/PG_WRITE_FILE), exige
  SELECT/WITH inicial, saca el `;` final (la RPC envuelve en subselect), llama la RPC con service
  role y **audita con `await` tanto `sql_query_executed` como `sql_query_blocked`** (el `audit()`
  de Nalika estampa la IP solo). Defensa en profundidad: capa app + capa RPC + GRANT.
- **Módulo 9 — `/admin/usuarios`** (`components/admin/users-admin.tsx`, patrón UsuariosPage de
  SUK): lista con avatar, badge de rol (Admin terracota / Operador azul), badge Inactivo y "Vos";
  **crear usuario** (form email/nombre/pass ≥8/rol → `auth.admin.createUser` con
  `email_confirm: true` + insert en `admin_users` con **ROLLBACK `deleteUser` si falla el
  insert**); activar/desactivar; cambiar rol; **panel expandible de permisos por sección para
  operadores** (checkbox por sección asignable + sub-checkbox ámbar "Solo lectura" → `"seccion"` /
  `"seccion:readonly"`; las ADMIN_ONLY usuarios/consultas no aparecen — nuevo export
  `ASSIGNABLE_SECTIONS` en `lib/permissions.ts`); **reset de contraseña** en modal con 2 modos:
  "set directo" (`auth.admin.updateUserById`, pass ≥8) y "email" (link recovery vía
  `generateLink` + envío con Resend — 503 si no hay `RESEND_API_KEY`, 502 si falla el envío;
  helper nuevo `sendAdminPasswordResetEmail` en `lib/resend/emails.ts` que SÍ reporta error, a
  diferencia de los transaccionales fail-open). API `/api/admin/users` (GET/POST/PATCH) +
  `/api/admin/users/[id]/reset-password`, todo con `verifyAdminCanWrite("usuarios")` + `audit()`.
  **Anti auto-sabotaje server-side** (y espejado en la UI con botones deshabilitados): no podés
  desactivarte, ni cambiarte el rol, ni tocarte los permisos; PATCH valida roles válidos y que
  cada permiso sea de `ASSIGNABLE_SECTIONS` (con o sin `:readonly`).
- **Módulo 10 (UI/UX admin)**: sin trabajo nuevo — verificado que ya estaba cubierto por los
  módulos anteriores (sidebar filtrado por permisos, "Ver sitio", email+rol+Cerrar sesión en el
  layout; filtros y búsquedas replicados en Pedidos/Catálogo/Clientes/etc.). Se marca ✅.
- **Con esto el PLAN DE 10 MÓDULOS queda TERMINADO.** Pendientes que siguen abiertos: valores
  reales de `BANK_*`/`NEXT_PUBLIC_WHATSAPP`/`RESEND_FROM`, Mercado Pago, dominio propio, y probar
  checkout e2e con datos reales.

## Convenciones (heredadas de SUK/B2B)

- **Precios y descuentos SIEMPRE server-side** — nunca confiar en el cliente.
- **Estado de pago separado del estado logístico** en pedidos.
- Defensa en profundidad: cada server action/API valida permisos por sí misma, no confía solo en el layout.
- Server Components por defecto; `"use client"` solo cuando hace falta.
- Mutaciones vía Server Actions; fetch de datos en RSC.
- TypeScript estricto; `kebab-case` archivos, `PascalCase` componentes; Tailwind para todo el styling.
- Textos de UI en es-AR.

## Historia / Estado de la infraestructura

**2026-07-22 — Migración de Supabase (proyecto perdido por inactividad):**
- El proyecto Supabase original se pausó por inactividad (free tier). Se creó **"Nalika Web"** y se
  re-aplicaron las migraciones. El proyecto viejo ("SilvestreNovaro's Project") sigue en la org por si
  hay que rescatar datos.
- Al re-migrar aparecieron 2 bugs de schema que en el proyecto viejo estaban parcheados a mano
  (drift): la función **`public.is_admin()`** no estaba versionada (migración `20260402120000`) y la
  política RLS **"Admins can view all profiles" era recursiva** → error 42P17 en todo SELECT
  autenticado de `profiles`, rompía el acceso a `/admin` (fix: migración `20260722000000`, la política
  ahora usa `is_admin()` que es `security definer`).
- Keys nuevas cargadas en `.env.local` y en Vercel (3 entornos). ⚠️ El `.env.local` NO debe tener BOM
  (el CLI de Supabase no lo parsea; ya pasó y se arregló).
- **Admins creados** (vía Auth Admin API + `profiles.role='admin'`): `joaquinnovaroh@gmail.com` y
  `silvestrenovarohueyo@gmail.com`. ⚠️ La de Silvestre tiene password débil temporal — cambiarla.

**Supabase CLI:** linkeado a `giutlxlkaotbplnogtlo`. Migraciones con `npm run db:migrate`
(= `supabase db push`). Cada quien necesita su token propio (`npx supabase login --token sbp_...`).

**Vercel CLI:** repo linkeado a `nalika` (`.vercel/project.json`). Env vars por CLI o dashboard.
⚠️ Cargar env vars por pipe de PowerShell al CLI NO funciona (quedan vacías) — usar la API REST o el dashboard.

## Esquema de base de datos (al 2026-07-22, pre-rediseño)

Migraciones aplicadas (en orden): `20260402000000` initial_schema · `20260402000001`
admin_categories_policy · `20260402120000` is_admin_function · `20260403000000` inventory ·
`20260407000000` subcategories · `20260722000000` fix_profiles_policy_recursion.

Tablas: `profiles` (extiende auth.users, `role` customer/admin, trigger `handle_new_user`) ·
`categories` (+ subcategorías) · `products` · `orders` · `order_items` · `stock_movements` (inventario).
Storage: bucket `product-images` (lectura pública, escritura admin).

> ⚠️ Este esquema se va a transformar con el rediseño (ver PLAN). La DB está **vacía** (sin datos que
> preservar), así que las migraciones del rediseño pueden ser agresivas.

## Estructura actual del código (pre-rediseño)

```
app/
├── (auth)/ login · register
├── (shop)/ home · productos (+[slug]) · carrito
├── admin/  dashboard · categorias · clientes(+[id]) · inventario(+[id]) · ordenes(+[id])
│           · productos(+nuevo,[id]) · reportes        ← SE REEMPLAZA ENTERO (ver PLAN)
├── api/    emails/order-confirmation · webhooks/auth
├── auth/   callback · signout
├── checkout/ (+confirmacion) · cuenta/
components/ admin/* · layout/* · shop/*
lib/ cart-context (localStorage) · utils · resend/emails · supabase/{client,server,admin,middleware}
middleware.ts (protege /cuenta y /admin vía updateSession)
```

## Comandos

- **Dev:** `npm run dev` → http://localhost:3000
- **Build (obligatorio antes de commit):** `npm run build`
- **Migraciones:** `npm run db:new <nombre>` crea · `npm run db:migrate` aplica · `npm run db:status` estado
- **Tipos DB:** `npm run db:types` (regenerar tras cada migración)
- **Deploy:** commit + push a `master` → auto-deploy Vercel
