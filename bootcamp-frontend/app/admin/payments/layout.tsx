// Título de la pestaña para esta sección (las páginas son "use client" y no pueden exportarlo)
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · Pagos y certificados",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
