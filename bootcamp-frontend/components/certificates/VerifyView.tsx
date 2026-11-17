// src/components/certificates/VerifyView.tsx
// Verificación pública de certificados y constancias por su código.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { certificatesApi, VerifyResult } from "@/hooks/useCertificatesApi";

const fecha = (d?: string) =>
  d ? new Date(d).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" }) : "";

export function VerifyView({ initialCode = "" }: { initialCode?: string }) {
  const router = useRouter();
  const [codigo, setCodigo] = useState(initialCode);
  const [resultado, setResultado] = useState<VerifyResult | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [falla, setFalla] = useState(false);

  useEffect(() => {
    if (!initialCode) return;
    setBuscando(true);
    certificatesApi
      .verify(initialCode)
      .then(setResultado)
      .catch(() => setFalla(true))
      .finally(() => setBuscando(false));
  }, [initialCode]);

  const buscar = (e: React.FormEvent) => {
    e.preventDefault();
    const c = codigo.trim().toUpperCase();
    if (c) router.push(`/verificar/${encodeURIComponent(c)}`);
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      <header className="border-b border-[rgba(0,192,231,0.12)] bg-[#111827]">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/"><BrandLogo width={170} /></Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-12">
        <h1 className="font-brand text-[#00C0E7] text-2xl sm:text-3xl uppercase tracking-wide text-center">
          Verificar certificado
        </h1>
        <p className="text-gray-500 text-sm text-center mt-2">
          Ingresa el código que aparece en el certificado o la constancia (por ejemplo, SIJB-CE-1A2B3C4D5E).
        </p>

        <form onSubmit={buscar} className="mt-8 flex flex-col sm:flex-row gap-3">
          <label htmlFor="codigo" className="sr-only">Código</label>
          <input
            id="codigo"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="SIJB-CE-XXXXXXXXXX"
            className="input-dark font-mono uppercase flex-1"
            autoComplete="off"
            maxLength={32}
          />
          <button type="submit" className="btn-red px-6 py-2.5 text-sm">Verificar</button>
        </form>

        <div className="mt-8" aria-live="polite">
          {buscando && <div className="flex justify-center py-8"><div className="spinner-cyan" /></div>}

          {!buscando && falla && (
            <div className="card-dark p-6 text-center text-gray-400 text-sm">
              No pudimos consultar en este momento. Intenta de nuevo en unos minutos.
            </div>
          )}

          {!buscando && !falla && resultado && resultado.valid && (
            <div className="card-dark p-6 border-t-4 border-t-[#00C0E7]">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-[#00C0E7] text-[#0d0d0d] flex items-center justify-center text-xl font-bold">✓</span>
                <div>
                  <p className="text-[#00C0E7] font-bold uppercase tracking-wider text-xs">Documento válido</p>
                  <p className="text-white font-semibold">
                    {resultado.type === "certificado" ? "Certificado oficial" : "Constancia de culminación"}
                  </p>
                </div>
              </div>
              <dl className="mt-5 grid gap-3 sm:grid-cols-2 text-sm">
                <div><dt className="text-gray-500 text-xs uppercase tracking-wider">Otorgado a</dt><dd className="text-white font-semibold">{resultado.studentName}</dd></div>
                {resultado.document && (
                  <div><dt className="text-gray-500 text-xs uppercase tracking-wider">Documento</dt><dd className="text-white font-mono">{resultado.document}</dd></div>
                )}
                <div className="sm:col-span-2"><dt className="text-gray-500 text-xs uppercase tracking-wider">Curso</dt><dd className="text-white font-semibold">{resultado.courseName}</dd></div>
                <div><dt className="text-gray-500 text-xs uppercase tracking-wider">Culminó el</dt><dd className="text-white">{fecha(resultado.completedAt)}</dd></div>
                <div><dt className="text-gray-500 text-xs uppercase tracking-wider">Código</dt><dd className="text-white font-mono">{resultado.code}</dd></div>
              </dl>
              <p className="text-gray-500 text-xs mt-5">Emitido por Soluciones Integrales JB a través de su Plataforma Bootcamp.</p>
            </div>
          )}

          {!buscando && !falla && resultado && !resultado.valid && (
            <div className="card-dark p-6 border-t-4 border-t-[#E31E24] text-center">
              <p className="text-[#E31E24] font-bold uppercase tracking-wider text-xs">No encontrado</p>
              <p className="text-gray-400 text-sm mt-2">
                El código no corresponde a ningún documento vigente. Revisa que esté escrito igual que en el certificado.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
