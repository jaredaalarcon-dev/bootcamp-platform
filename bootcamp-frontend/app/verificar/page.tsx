// src/app/verificar/page.tsx — verificación pública de certificados
import { VerifyView } from "@/components/certificates/VerifyView";

export const metadata = { title: "Verificar certificado" };

export default function VerificarPage() {
  return <VerifyView />;
}
