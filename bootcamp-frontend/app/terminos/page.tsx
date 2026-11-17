// src/app/terminos/page.tsx
import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { TERMINOS } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Términos y Condiciones — Soluciones Integrales JB",
  description: "Condiciones de uso de la Plataforma Bootcamp de Soluciones Integrales JB.",
};

export default function TerminosPage() {
  return (
    <LegalDocument
      tipo="terminos"
      titulo="Términos y Condiciones"
      intro="Estas son las reglas para usar la Plataforma Bootcamp: tu cuenta, los cursos, los pagos, los certificados y el uso del contenido. Léelas con calma; están escritas para que se entiendan."
      secciones={TERMINOS}
    />
  );
}
