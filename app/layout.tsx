import type { Metadata } from "next";
import { Geist, Geist_Mono, Baloo_2 } from "next/font/google";
import { CartProvider } from "@/lib/cart-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Tipografía del wordmark del logo (Baloo 2 SemiBold).
const balooLogo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: "600",
});

export const metadata: Metadata = {
  title: {
    default: "Nalika — Tienda de mascotas",
    template: "%s | Nalika",
  },
  description:
    "Todo para tu mascota: alimento, juguetes, accesorios e higiene, al mejor precio.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    title: "Nalika — Tienda de mascotas",
    description:
      "Todo para tu mascota: alimento, juguetes, accesorios e higiene, al mejor precio.",
    type: "website",
  },
};

// Layout raíz SIN chrome: el sitio público tiene Header/Footer en (shop)/layout,
// el backoffice tiene su propio chrome en admin/(protected)/layout (patrón SUK).
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${balooLogo.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-gray-50">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
