// src/app/layout.tsx
import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Soluciones Integrales JB — Bootcamp",
  description: "Plataforma educativa de Soluciones Integrales JB",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Anton&display=swap" rel="stylesheet" />
      </head>
      <body>
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
