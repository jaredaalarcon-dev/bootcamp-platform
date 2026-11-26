// Título de la pestaña para esta sección (la página es "use client" y no puede exportarlo)
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · Preguntas y reseñas",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
