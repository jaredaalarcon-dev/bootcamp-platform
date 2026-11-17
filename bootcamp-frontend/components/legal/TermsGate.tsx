// src/components/legal/TermsGate.tsx
// Pide aceptar los Términos y la Política de Privacidad UNA sola vez:
// a quienes se registraron antes de que existieran, o cuando se publica
// una versión nueva. Quien se registró aceptándolos no ve nada.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/useAuth";
import { TERMS_FECHA, TERMS_VERSION } from "@/lib/legal";

const CLAVE = `sijb-terminos-${TERMS_VERSION}`;

export function TermsGate() {
  const router = useRouter();
  const { logout } = useAuth();
  const [visible, setVisible] = useState(false);
  const [acepta, setAcepta] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem("accessToken")) return;
      if (sessionStorage.getItem(CLAVE) === "1") return;
    } catch {
      return;
    }
    apiClient
      .get("/legal/status")
      .then(({ data }) => {
        if (data?.data?.accepted) {
          try { sessionStorage.setItem(CLAVE, "1"); } catch {}
        } else {
          setVisible(true);
        }
      })
      // Si el servidor no responde, no bloqueamos al usuario
      .catch(() => {});
  }, []);

  const aceptar = async () => {
    setEnviando(true);
    try {
      await apiClient.post("/legal/accept", { version: TERMS_VERSION });
      try { sessionStorage.setItem(CLAVE, "1"); } catch {}
      setVisible(false);
      toast.success("¡Gracias! Ya puedes continuar.");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "No se pudo guardar tu aceptación. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  const salir = () => {
    logout();
    router.push("/login");
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="terminos-titulo">
      <div className="card-dark w-full max-w-lg overflow-hidden !p-0 shadow-2xl">
        <div className="h-1 bg-gradient-to-r from-[#00C0E7] via-[#00C0E7] to-[#E31E24]" />
        <div className="p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[rgba(0,192,231,0.12)] text-[#00C0E7]">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.6-4.8A11.9 11.9 0 0112 2.9 11.9 11.9 0 013.4 7.2 12 12 0 003 10c0 5.6 3.8 10.3 9 11.6 5.2-1.3 9-6 9-11.6 0-1-.1-1.9-.4-2.8z" /></svg>
            </span>
            <div>
              <h2 id="terminos-titulo" className="text-lg font-semibold text-white">Términos y Privacidad</h2>
              <p className="text-xs text-gray-500">Versión vigente desde el {TERMS_FECHA}</p>
            </div>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-gray-400">
            Para seguir usando la plataforma necesitamos que revises y aceptes nuestros documentos. En resumen:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-gray-400">
            {[
              "Tu cuenta es personal y los contenidos son solo para tu estudio.",
              "Certificado en cursos pagados y constancia en cursos gratuitos.",
              "Protegemos tus datos según la Ley N.° 29733 y puedes ejercer tus derechos cuando quieras.",
            ].map((t) => (
              <li key={t} className="flex gap-2.5">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rotate-45 bg-[#00C0E7]" aria-hidden />
                {t}
              </li>
            ))}
          </ul>

          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-[rgba(0,192,231,0.18)] bg-[rgba(0,192,231,0.04)] p-3 text-sm leading-snug text-gray-400">
            <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#00C0E7]" />
            <span>
              He leído y acepto los{" "}
              <Link href="/terminos" target="_blank" className="font-semibold text-[#00C0E7] hover:underline">Términos y Condiciones</Link> y la{" "}
              <Link href="/privacidad" target="_blank" className="font-semibold text-[#00C0E7] hover:underline">Política de Privacidad</Link>.
            </span>
          </label>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button onClick={salir} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-400 hover:text-white">
              Cerrar sesión
            </button>
            <button onClick={aceptar} disabled={!acepta || enviando} className="btn-cyan px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50">
              {enviando ? "Guardando…" : "Aceptar y continuar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
