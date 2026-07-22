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
| 3 | **Clientes** | Listado + detalle de clientes como SUK. | ⬜ |
| 4 | **Promociones** | Modelo de precios SUK: `base_price` (normal) + `promo_price` (opcional) + **% descuento por transferencia GLOBAL** (`store_settings`, toggle + % editable en admin). Cálculo único server-side (`lib/pricing.ts`). | ⬜ |
| 5 | **Banners** | Admin de banners por sección del sitio + bucket `banners` + carrusel hero full-viewport en la home. Specs SUK: desktop **1920×1080**, mobile **1080×1920**. Banners genéricos de mascotas hasta tener reales. | ⬜ |
| 6 | **Galería Mascotas** | = "Suk Comunidad" renombrado: fotos de clientes/mascotas, admin para subir/ordenar/activar/eliminar, sección en home + página propia. | ⬜ |
| 7 | **Exportar CSV** | `/admin/exportar` + endpoint de export como SUK (con protección CSV injection). | ⬜ |
| 8 | **Consultas SQL** | Consola solo-SELECT del admin: RPC `execute_readonly_query` (solo `service_role`, revocada a anon/authenticated), queries guardadas, auditoría. | ⬜ |
| 9 | **Usuarios** | Roles `admin`/`operador`, tabla `admin_users` (RLS deny-all, acceso solo por service role) + permisos por sección + `audit_logs` + reset de contraseña. | ⬜ |
| 10 | **UI/UX admin** | Sidebar lateral filtrado por permisos, "Ver sitio", rol visible, **cerrar sesión**, patrones de filtros/búsqueda/paginación de SUK. | ⬜ |

**Front de tienda**: se rediseña en paralelo a medida que entran los módulos (home con hero carrusel de
banners + destacados + galería mascotas, catálogo, detalle, carrito, checkout con doble precio).

**Pendientes de decisión del dueño** (no bloquean): Mercado Pago (SUK lo tiene LIVE; Nalika necesitaría
su propia cuenta/token — mientras tanto, checkout por transferencia + confirmación manual), dominio
propio, identidad visual definitiva (logo/colores de Nalika).

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
