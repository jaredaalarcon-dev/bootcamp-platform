// src/app/layout.tsx
import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { ThemeSync } from "@/components/ui/ThemeSync";

export const metadata: Metadata = {
  title: "Soluciones Integrales JB — Plataforma de Cursos",
  description: "Plataforma educativa de Soluciones Integrales JB — Tu mejor opción tecnológica",
};

// Aplica el tema guardado ANTES de pintar (evita el parpadeo claro/oscuro).
// Por defecto: oscuro, que es la identidad de la marca.
const temaInicial = `(function(){try{var t=localStorage.getItem('sijb-theme');if(t!=='light'&&t!=='dark'){t='dark';}var h=document.documentElement;h.classList.add(t);h.style.colorScheme=t;}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: temaInicial }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Anton&family=Great+Vibes&family=Playfair+Display:ital,wght@0,500;0,700;1,500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ThemeSync />
        {children}
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
