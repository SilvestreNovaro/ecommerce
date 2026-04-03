# CLAUDE.md — Proyecto Ecommerce

## Repositorio

- **GitHub:** https://github.com/SilvestreNovaro/ecommerce
- **Deploy:** Vercel (pendiente de conectar)

---

## Stack

- **Framework:** Next.js 14+ (App Router)
- **Estilos:** Tailwind CSS
- **Base de datos / Auth / Storage:** Supabase
- **Deploy:** Vercel (conectado a GitHub)
- **Emails transaccionales:** Resend
- **Repositorio:** GitHub

---

## Estructura de carpetas esperada

```
/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (shop)/
│   │   ├── page.tsx          # Home / vitrina
│   │   ├── productos/
│   │   │   ├── page.tsx      # Listado
│   │   │   └── [slug]/
│   │   │       └── page.tsx  # Detalle de producto
│   │   └── carrito/
│   │       └── page.tsx
│   ├── checkout/
│   │   └── page.tsx
│   ├── cuenta/
│   │   └── page.tsx
│   ├── admin/                # Panel de administración (protegido)
│   │   ├── page.tsx
│   │   ├── productos/
│   │   └── ordenes/
│   ├── api/
│   │   ├── webhooks/
│   │   └── emails/
│   └── layout.tsx
├── components/
│   ├── ui/                   # Componentes base (buttons, inputs, modals)
│   ├── shop/                 # Componentes del ecommerce
│   └── layout/               # Header, Footer, Nav
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Cliente browser
│   │   ├── server.ts         # Cliente server (SSR)
│   │   ├── admin.ts          # Cliente con service role
│   │   └── middleware.ts     # Helper para middleware de sesión
│   ├── resend/
│   │   └── emails.ts
│   └── utils.ts
├── types/
│   └── index.ts              # Tipos globales (Product, Order, User, etc.)
├── middleware.ts              # Protección de rutas con Supabase Auth
└── supabase/
    └── migrations/           # Migraciones SQL
```

---

## Variables de entorno

Crear `.env.local` con:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

En Vercel: configurar las mismas variables en Settings > Environment Variables (separar por entorno: Production / Preview / Development).

---

## Supabase

### Auth
- Usar `@supabase/ssr` para manejo correcto en Next.js App Router
- Magic link + OAuth (Google como mínimo)
- Middleware en `middleware.ts` para proteger rutas `/cuenta/*` y `/admin/*`

### Tablas principales
- `products` — catálogo
- `categories` — categorías de productos
- `orders` — órdenes de compra
- `order_items` — ítems de cada orden
- `profiles` — extensión de auth.users

### Row Level Security
- Siempre habilitada
- Usuarios solo ven sus propias órdenes
- Admin tiene acceso total (validar por `role` en `profiles`)

### Storage
- Bucket `product-images` para imágenes de productos
- Acceso público de lectura, escritura solo para admin

---

## Emails con Resend

- Usar React Email para templates
- Emails a implementar:
  - Confirmación de orden
  - Estado de envío actualizado
  - Bienvenida al registrarse
  - Recupero de contraseña (puede delegarse a Supabase Auth)

---

## Convenciones de código

- **TypeScript** estricto en todo el proyecto
- **Server Components** por defecto; `"use client"` solo cuando haga falta
- **Fetch de datos** en Server Components usando el cliente Supabase server-side
- **Mutations** vía Server Actions (`"use server"`)
- **No usar** `useEffect` para fetching de datos — usar RSC o SWR/React Query si es necesario en client
- Nombrar archivos: `kebab-case` para carpetas y archivos, `PascalCase` para componentes
- Cada componente en su propio archivo
- Tailwind para todo el styling; no CSS modules salvo excepción justificada

---

## CI/CD

- **Branch principal:** `main` → deploya en producción automáticamente (Vercel)
- **Feature branches:** `feat/nombre-feature`
- **Cada PR** genera un preview deployment en Vercel
- Nunca commitear `.env.local`
- El `.gitignore` debe incluir: `.env*.local`, `.next/`, `node_modules/`

---

## Comandos frecuentes

```bash
# Desarrollo local
npm run dev

# Supabase local (opcional)
supabase start
supabase db reset
supabase gen types typescript --local > types/supabase.ts

# Build
npm run build
npm run start

# Lint
npm run lint
```

---

## Prioridades de desarrollo

1. ~~Setup inicial: repo, Supabase proyecto, Vercel deploy base~~ ✅
2. Auth completo (login, registro, middleware de protección)
3. Catálogo de productos (listado + detalle)
4. Carrito de compras (estado cliente)
5. Checkout + creación de orden en Supabase
6. Emails transaccionales con Resend
7. Panel admin básico (ABM productos, vista de órdenes)
8. Polish: SEO, performance, accesibilidad, responsiveness fino
