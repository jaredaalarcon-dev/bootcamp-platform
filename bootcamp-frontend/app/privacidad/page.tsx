// src/app/privacidad/page.tsx
import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { PRIVACIDAD } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Cómo tratamos y protegemos tus datos personales en la Plataforma Bootcamp.",
};

export default function PrivacidadPage() {
  return (
    <LegalDocument
      tipo="privacidad"
      titulo="Política de Privacidad"
      intro="Te explicamos qué datos personales usamos, para qué, con quién los compartimos y cómo puedes ejercer tus derechos, conforme a la Ley N.° 29733 de Protección de Datos Personales."
      secciones={PRIVACIDAD}
    />
  );
}
