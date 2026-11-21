// src/app/verificar/[code]/page.tsx — resultado de la verificación de un código
import { VerifyView } from "@/components/certificates/VerifyView";

export const metadata = { title: "Verificar certificado" };

export default async function VerificarCodigoPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <VerifyView initialCode={decodeURIComponent(code).toUpperCase()} />;
}
