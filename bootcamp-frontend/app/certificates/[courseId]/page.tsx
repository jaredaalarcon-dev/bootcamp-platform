// src/app/certificates/[courseId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api-client";
import { BrandLogo, LOGO_SRC, ICONO_SRC } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

// ── Datos de la firma (edítalos aquí) ─────────────────────────────────────
// Coloca la imagen de la firma digital (PNG con fondo transparente) en:
//   bootcamp-frontend/public/brand/firma-gerente.png
// Si la imagen no existe, el certificado deja el espacio en blanco para firmar.
const FIRMA = {
  imagen: "/brand/firma-gerente.png",
  nombre: "", // Ej: "Juan Pérez Gómez" — déjalo vacío si no quieres mostrarlo
  cargo: "Gerente General",
  empresa: "Soluciones Integrales JB S.A.C.",
};

interface CertData {
  certificateId: string;
  studentName: string;
  courseName: string;
  courseCategory: string;
  completedAt: string;
}

// ── Sello circular con texto alrededor ────────────────────────────────────
function Sello() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full" aria-hidden>
      <defs>
        <path id="arcoSello" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
      </defs>
      <circle cx="100" cy="100" r="97" fill="#ffffff" stroke="#00C0E7" strokeWidth="4" />
      <circle cx="100" cy="100" r="89" fill="none" stroke="#E31E24" strokeWidth="1.6" />
      <circle cx="100" cy="100" r="58" fill="#111111" stroke="#00C0E7" strokeWidth="2.5" />
      {/* textLength reparte el texto exacto en la circunferencia (2π·74 ≈ 462) */}
      <text fill="#111111" fontSize="12.5" fontWeight="700" style={{ fontFamily: "Anton, Impact, sans-serif" }}>
        <textPath href="#arcoSello" startOffset="0" textLength="458" lengthAdjust="spacingAndGlyphs">
          SOLUCIONES INTEGRALES JB ★ CERTIFICADO OFICIAL ★
        </textPath>
      </text>
      <image href={ICONO_SRC} x="58" y="56" width="84" height="84" preserveAspectRatio="xMidYMid meet" />
    </svg>
  );
}

// ── Esquinas decorativas ──────────────────────────────────────────────────
function Esquina({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const rot = { tl: 0, tr: 90, br: 180, bl: 270 }[pos];
  const lugar = {
    tl: { top: "1.1cqw", left: "1.1cqw" },
    tr: { top: "1.1cqw", right: "1.1cqw" },
    br: { bottom: "1.1cqw", right: "1.1cqw" },
    bl: { bottom: "1.1cqw", left: "1.1cqw" },
  }[pos];
  return (
    <svg viewBox="0 0 60 60" className="absolute" style={{ ...lugar, width: "5.2cqw", height: "5.2cqw", transform: `rotate(${rot}deg)` }} aria-hidden>
      <path d="M0 0 H60 V6 H6 V60 H0 Z" fill="#00C0E7" />
      <path d="M12 12 H42 V15 H15 V42 H12 Z" fill="#E31E24" />
      <rect x="21" y="21" width="6" height="6" fill="#111111" />
    </svg>
  );
}

export default function CertificatePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.courseId as string;
  const { getToken } = useAuth();

  const [cert, setCert] = useState<CertData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hayFirma, setHayFirma] = useState(true);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    apiClient
      .get(`/certificates/course/${courseId}`)
      .then(({ data }) => setCert(data.data ?? data))
      .catch((err) => setError(err?.response?.data?.message ?? "No se pudo cargar el certificado"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const fecha = cert?.completedAt
    ? new Date(cert.completedAt).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })
    : "";

  // El nombre del PDF guardado sale del título de la página
  const imprimir = () => {
    const anterior = document.title;
    if (cert) document.title = `Certificado SIJB - ${cert.studentName} - ${cert.courseName}`;
    window.print();
    setTimeout(() => (document.title = anterior), 500);
  };

  // ── Cargando ────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d0d0d]">
      <div className="spinner-cyan" />
    </div>
  );

  // ── No disponible ───────────────────────────────────────────────────────
  if (error || !cert) return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d0d0d] px-4">
      <div className="max-w-md text-center card-dark p-10">
        <div className="flex justify-center mb-6"><BrandLogo width={260} align="center" /></div>
        <h2 className="font-brand text-[#E31E24] text-xl uppercase tracking-wide mb-3">Certificado no disponible</h2>
        <p className="text-gray-400 text-sm mb-6">
          {error ?? "Necesitas completar el 100% del curso para obtener tu certificado."}
        </p>
        <Link href={`/courses/${courseId}`} className="btn-red text-sm px-6 py-2.5">Continuar el curso</Link>
      </div>
    </div>
  );

  // ── Certificado ─────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @page { size: A4 landscape; margin: 0; }
        @media print {
          html, body { background: #ffffff !important; margin: 0 !important; }
          .no-print { display: none !important; }
          .cert-pagina { padding: 0 !important; background: #ffffff !important; min-height: 0 !important; }
          .cert-marco { width: 297mm !important; max-width: none !important; box-shadow: none !important; margin: 0 !important; padding: 0 !important; }
          .cert-hoja { border-radius: 0 !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div className="cert-pagina min-h-screen bg-[#0d0d0d] pb-10">
        {/* Barra superior */}
        <div className="no-print border-b border-[rgba(0,192,231,0.12)] bg-[#111827]">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <Link href="/certificates" className="text-gray-400 hover:text-[#00C0E7] text-sm flex items-center gap-2 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              Mis certificados
            </Link>
            <BrandLogo width={170} />
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button onClick={imprimir} className="btn-red flex items-center gap-2 text-sm px-4 py-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Descargar PDF
              </button>
            </div>
          </div>
        </div>

        <div className="no-print text-center mt-6 mb-4 px-4">
          <p className="font-brand text-[#00C0E7] text-lg uppercase tracking-wide">¡Felicitaciones, {cert.studentName.split(" ")[0]}!</p>
          <p className="text-gray-500 text-sm">Este es tu certificado oficial. Puedes descargarlo como PDF.</p>
        </div>

        {/* ── Hoja del certificado (A4 horizontal, escala con el ancho) ── */}
        <div className="cert-marco mx-auto w-full max-w-[1100px] px-3 sm:px-6 shadow-[0_0_60px_rgba(0,192,231,0.12)]" style={{ containerType: "inline-size" }}>
          <div
            className="cert-hoja keep-theme relative w-full overflow-hidden rounded-md text-[#111111]"
            style={{
              aspectRatio: "297 / 210",
              background:
                "radial-gradient(circle at 15% 85%, rgba(0,192,231,0.07), transparent 45%), radial-gradient(circle at 90% 20%, rgba(0,192,231,0.06), transparent 40%), #fcfdfd",
            }}
          >
            {/* Marca de agua del cubo */}
            <img
              src={ICONO_SRC}
              alt=""
              aria-hidden
              className="absolute pointer-events-none select-none"
              style={{ width: "34cqw", left: "50%", top: "54%", transform: "translate(-50%,-50%)", opacity: 0.045 }}
            />

            {/* Marcos */}
            <div className="absolute" style={{ inset: "1.6cqw", border: "0.32cqw solid #00C0E7" }} />
            <div className="absolute" style={{ inset: "2.35cqw", border: "0.09cqw solid #111111" }} />
            <Esquina pos="tl" /><Esquina pos="tr" /><Esquina pos="bl" /><Esquina pos="br" />

            {/* Contenido */}
            <div className="absolute flex flex-col items-center text-center" style={{ inset: "2.35cqw" }}>
              {/* Franja con el logo */}
              <div className="w-full flex flex-col items-center justify-center bg-[#111111]" style={{ paddingTop: "1.5cqw", paddingBottom: "1.2cqw" }}>
                <img src={LOGO_SRC} alt="Soluciones Integrales JB" draggable={false} style={{ width: "38cqw", height: "auto" }} />
              </div>
              <div className="w-full bg-[#00C0E7]" style={{ height: "0.35cqw" }} />

              {/* Título */}
              <h1 className="font-brand uppercase leading-none" style={{ fontSize: "5.4cqw", letterSpacing: "0.16em", marginTop: "2.4cqw" }}>
                Certificado
              </h1>
              <div className="flex items-center" style={{ gap: "1.2cqw", marginTop: "0.7cqw" }}>
                <span className="bg-[#E31E24]" style={{ height: "0.18cqw", width: "6cqw" }} />
                <p className="font-brand uppercase text-[#00C0E7]" style={{ fontSize: "1.55cqw", letterSpacing: "0.45em" }}>
                  de finalización
                </p>
                <span className="bg-[#E31E24]" style={{ height: "0.18cqw", width: "6cqw" }} />
              </div>

              {/* Alumno */}
              <p className="text-gray-600 italic" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.45cqw", marginTop: "2.2cqw" }}>
                Se otorga el presente certificado a:
              </p>
              <p
                className="font-bold text-[#0d0d0d] leading-tight"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "3.9cqw", marginTop: "0.6cqw", maxWidth: "80cqw" }}
              >
                {cert.studentName}
              </p>
              <div style={{ height: "0.16cqw", width: "44cqw", marginTop: "0.6cqw", background: "linear-gradient(90deg, transparent, #00C0E7 20%, #00C0E7 80%, transparent)" }} />

              {/* Curso */}
              <p className="text-gray-700" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.45cqw", marginTop: "1.6cqw" }}>
                por haber culminado <span className="italic">satisfactoriamente</span> el curso
              </p>
              <p className="font-brand uppercase text-[#00C0E7] leading-tight" style={{ fontSize: "2.6cqw", letterSpacing: "0.04em", marginTop: "0.7cqw", maxWidth: "78cqw" }}>
                {cert.courseName}
              </p>
              <p className="text-gray-500" style={{ fontSize: "1.05cqw", marginTop: "0.9cqw" }}>
                Lima, Perú — {fecha}
              </p>

              {/* Pie: código · sello · firma */}
              <div className="w-full mt-auto grid grid-cols-3 items-end" style={{ padding: "0 5cqw 2.2cqw" }}>
                {/* Código */}
                <div className="text-left">
                  <p className="uppercase text-gray-500" style={{ fontSize: "0.85cqw", letterSpacing: "0.18em" }}>Código de certificado</p>
                  <p className="font-mono font-bold text-[#111111]" style={{ fontSize: "1.35cqw", marginTop: "0.3cqw" }}>{cert.certificateId}</p>
                  <p className="text-gray-400" style={{ fontSize: "0.8cqw", marginTop: "0.3cqw" }}>Emitido por Soluciones Integrales JB S.A.C.</p>
                </div>

                {/* Sello */}
                <div className="flex justify-center">
                  <div style={{ width: "11cqw", height: "11cqw" }}><Sello /></div>
                </div>

                {/* Firma */}
                <div className="flex flex-col items-center">
                  <div className="flex items-end justify-center" style={{ height: "5.4cqw", width: "24cqw" }}>
                    {hayFirma && (
                      <img
                        src={FIRMA.imagen}
                        alt="Firma"
                        onError={() => setHayFirma(false)}
                        style={{ maxHeight: "5.4cqw", maxWidth: "22cqw", objectFit: "contain" }}
                      />
                    )}
                  </div>
                  <div className="bg-[#111111]" style={{ height: "0.12cqw", width: "24cqw" }} />
                  {FIRMA.nombre && (
                    <p className="font-bold" style={{ fontSize: "1.15cqw", marginTop: "0.5cqw" }}>{FIRMA.nombre}</p>
                  )}
                  <p className="font-brand uppercase text-[#00C0E7]" style={{ fontSize: "1.05cqw", letterSpacing: "0.12em", marginTop: FIRMA.nombre ? "0.15cqw" : "0.5cqw" }}>
                    {FIRMA.cargo}
                  </p>
                  <p className="text-gray-600" style={{ fontSize: "0.95cqw" }}>{FIRMA.empresa}</p>
                </div>
              </div>

              {/* Franja inferior */}
              <div className="w-full flex" style={{ height: "0.7cqw" }}>
                <div className="flex-1 bg-[#00C0E7]" />
                <div className="bg-[#E31E24]" style={{ width: "22cqw" }} />
                <div className="bg-[#111111]" style={{ width: "6cqw" }} />
              </div>
            </div>
          </div>
        </div>

        <p className="no-print text-center text-gray-600 text-xs mt-5 px-4">
          Al descargar, en la ventana de impresión elige <b className="text-gray-400">“Guardar como PDF”</b> y orientación <b className="text-gray-400">Horizontal</b>.
        </p>
      </div>
    </>
  );
}
