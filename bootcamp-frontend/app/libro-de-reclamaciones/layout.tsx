import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Libro de Reclamaciones",
  description: "Libro de Reclamaciones virtual de Soluciones Integrales JB. Registra un reclamo o una queja y consulta su estado.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
