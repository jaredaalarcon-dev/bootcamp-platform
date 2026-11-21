// Título y descripción del Blog (la página es "use client" y no puede exportarlos)
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "Novedades, tutoriales y publicaciones de Soluciones Integrales JB.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
