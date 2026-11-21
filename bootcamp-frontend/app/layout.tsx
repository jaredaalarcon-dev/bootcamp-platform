// src/app/layout.tsx
import type { Metadata } from "next";
import Script from "next/script";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { ThemeSync } from "@/components/ui/ThemeSync";
import { JBAssist } from "@/components/assistant/JBAssist";

const SITIO = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITIO),
  // Cada página pone su propio título; se muestra como "Mis cursos · SIJB Bootcamp"
  title: {
    default: "SIJB Bootcamp — Cursos de tecnología de Soluciones Integrales JB",
    template: "%s · SIJB Bootcamp",
  },
  description:
    "Cursos virtuales de tecnología a tu ritmo: desarrollo web, apps móviles con IA, automatización, datos y ciberseguridad. Constancia gratuita y certificado verificable. Soluciones Integrales JB — Tu mejor opción tecnológica.",
  applicationName: "SIJB Bootcamp",
  keywords: ["cursos de tecnología", "bootcamp", "Perú", "Chancay", "programación", "certificado", "Soluciones Integrales JB"],
  openGraph: {
    type: "website",
    locale: "es_PE",
    siteName: "SIJB Bootcamp",
    title: "SIJB Bootcamp — Cursos de tecnología",
    description: "Cursos virtuales de tecnología con constancia gratuita y certificado verificable.",
    images: [{ url: "/brand/logo-sijb-oscuro.png", alt: "Soluciones Integrales JB" }],
  },
};

// Aplica el tema guardado ANTES de pintar (evita el parpadeo claro/oscuro).
// Por defecto: oscuro, que es la identidad de la marca.
const temaInicial = `(function(){try{var t=localStorage.getItem('sijb-theme');if(t!=='light'&&t!=='dark'){t='dark';}var h=document.documentElement;h.classList.add(t);h.style.colorScheme=t;}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <Script id="tema-inicial" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: temaInicial }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Anton&family=Great+Vibes&family=Playfair+Display:ital,wght@0,500;0,700;1,500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ThemeSync />
        {children}
        <JBAssist />
        {/* Visitas anónimas y sin cookies (solo funciona publicado en Vercel; en tu PC no hace nada) */}
        <Analytics />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { background: "#1f2937", color: "#fff" },
            success: { style: { background: "#065f46", borderLeft: "4px solid #00C0E7" } },
            error:   { style: { background: "#7f1d1d", borderLeft: "4px solid #E31E24" } },
          }}
        />
      </body>
    </html>
  );
}
