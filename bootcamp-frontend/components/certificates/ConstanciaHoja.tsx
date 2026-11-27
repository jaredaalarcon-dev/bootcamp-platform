// src/components/certificates/ConstanciaHoja.tsx
// Constancia de culminación (A4 horizontal). Todas las medidas usan "cqw" para
// que la hoja se vea igual en celular, en pantalla grande y al imprimir en PDF.
"use client";

import { useState } from "react";
import type { CertData } from "@/hooks/useCertificatesApi";

const LOGO = "/brand/logo-sijb-original-claro.png";
const ICONO = "/brand/cubo-sijb.png";
const CIAN = "#00C0E7";
const ROJO = "#E31E24";

// Mosaico de casillas, como las caras del cubo de la marca
function Mosaico() {
  const filas = 4, cols = 6;
  const colores = ["#00C0E7", "#0a8fb0", "#ffffff", "#0b5c74", "#00C0E7", "#123441"];
  return (
    <svg viewBox={`0 0 ${cols * 10} ${filas * 10}`} className="absolute inset-x-0 bottom-0 w-full" style={{ height: "24%", opacity: 0.14 }} preserveAspectRatio="xMidYMax slice" aria-hidden>
      {Array.from({ length: filas * cols }, (_, i) => {
        const x = (i % cols) * 10, y = Math.floor(i / cols) * 10;
        return <rect key={i} x={x + 0.8} y={y + 0.8} width={8.4} height={8.4} rx={1.8} fill={colores[(i * 7 + Math.floor(i / cols)) % colores.length]} />;
      })}
    </svg>
  );
}

function Sello() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full" aria-hidden>
      <defs>
        <path id="arcoConst" d="M100,100 m-75,0 a75,75 0 1,1 150,0 a75,75 0 1,1 -150,0" />
        <radialGradient id="selloFondo"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#eefbfe" /></radialGradient>
      </defs>
      <circle cx="100" cy="100" r="97" fill="url(#selloFondo)" stroke={CIAN} strokeWidth="4" />
      <circle cx="100" cy="100" r="88" fill="none" stroke={ROJO} strokeWidth="1.6" strokeDasharray="3 3" />
      <text fill="#111111" fontSize="12" fontWeight="700" style={{ fontFamily: "Anton, Impact, sans-serif" }}>
        <textPath href="#arcoConst" textLength="464" lengthAdjust="spacingAndGlyphs">
          SOLUCIONES INTEGRALES JB ★ CONSTANCIA VERIFICADA ★
        </textPath>
      </text>
      <circle cx="100" cy="100" r="56" fill="#0d0d0d" stroke={CIAN} strokeWidth="2.5" />
      <image href={ICONO} x="60" y="58" width="80" height="80" />
    </svg>
  );
}

interface Props {
  cert: CertData;
  fecha: string;
  dominio: string;
  firma: { imagen: string; nombre: string; cargo: string; empresa: string };
}

export function ConstanciaHoja({ cert, fecha, dominio, firma }: Props) {
  const [hayFirma, setHayFirma] = useState(true);
  const detalles = [
    `${cert.totalLessons} lecciones completadas`,
    cert.finalExamScore != null ? `Examen final aprobado: ${cert.finalExamScore} %` : null,
    "Modalidad virtual",
  ].filter(Boolean) as string[];

  return (
    <div
      className="cert-hoja keep-theme relative w-full overflow-hidden rounded-md text-[#111111] bg-white"
      style={{ aspectRatio: "297 / 210" }}
    >
      {/* ── Panel izquierdo oscuro ─────────────────────────────────────── */}
      <div className="absolute inset-y-0 left-0 flex flex-col items-center overflow-hidden" style={{ width: "27cqw", background: "linear-gradient(165deg, #0d0d0d 0%, #0f1d26 55%, #0b2b37 100%)" }}>
        <Mosaico />
        <div className="absolute inset-y-0 right-0" style={{ width: "0.55cqw", background: `linear-gradient(${CIAN}, ${CIAN} 70%, ${ROJO} 70%)` }} />

        <img src={ICONO} alt="" aria-hidden draggable={false} style={{ width: "9cqw", marginTop: "3.4cqw", filter: "drop-shadow(0 0.6cqw 1.4cqw rgba(0,192,231,.45))" }} />
        <p className="font-brand uppercase text-white text-center leading-none" style={{ fontSize: "1.55cqw", letterSpacing: "0.3em", marginTop: "1.4cqw" }}>
          Bootcamp
        </p>
        <p className="font-brand uppercase text-center leading-none" style={{ fontSize: "1.05cqw", letterSpacing: "0.42em", marginTop: "0.6cqw", color: CIAN }}>
          SIJB
        </p>

        {/* Foto (si el alumno la subió) */}
        <div className="relative" style={{ marginTop: "2.6cqw", width: "12.6cqw", aspectRatio: "3 / 4" }}>
          <div className="absolute inset-0 rounded" style={{ border: `0.28cqw solid ${CIAN}`, boxShadow: "0 0 2.2cqw rgba(0,192,231,.35)" }} />
          {cert.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cert.photoUrl} alt="" className="absolute object-cover rounded-sm" style={{ inset: "0.6cqw", width: "calc(100% - 1.2cqw)", height: "calc(100% - 1.2cqw)" }} />
          ) : (
            <div className="absolute flex items-center justify-center rounded-sm" style={{ inset: "0.6cqw", background: "rgba(255,255,255,.06)" }}>
              <span className="font-brand text-white" style={{ fontSize: "5cqw", opacity: 0.9 }}>{cert.studentName.trim()[0]?.toUpperCase()}</span>
            </div>
          )}
        </div>

        {/* Código */}
        <div className="relative z-10 text-center" style={{ marginTop: "2.4cqw", padding: "0 1.6cqw" }}>
          <p className="uppercase text-gray-400" style={{ fontSize: "0.78cqw", letterSpacing: "0.22em" }}>Código de verificación</p>
          <p className="font-mono font-bold text-white" style={{ fontSize: "1.32cqw", marginTop: "0.4cqw", letterSpacing: "0.04em" }}>{cert.certificateId}</p>
          <p className="text-gray-400" style={{ fontSize: "0.78cqw", marginTop: "0.5cqw" }}>Verifícala en</p>
          <p style={{ fontSize: "0.9cqw", color: CIAN, fontWeight: 600 }}>{dominio}/verificar</p>
        </div>
      </div>

      {/* Marca de agua */}
      <img src={ICONO} alt="" aria-hidden className="absolute pointer-events-none select-none" style={{ width: "30cqw", right: "4cqw", top: "50%", transform: "translateY(-46%)", opacity: 0.04 }} />

      {/* ── Contenido ─────────────────────────────────────────────────── */}
      <div className="absolute inset-y-0 right-0 flex flex-col" style={{ left: "27cqw", padding: "3.2cqw 4.4cqw 0 5cqw" }}>
        <img src={LOGO} alt="Soluciones Integrales JB" draggable={false} style={{ width: "36cqw", height: "auto" }} />

        <div style={{ marginTop: "3cqw" }}>
          <h1 className="font-brand uppercase leading-none text-[#0d0d0d]" style={{ fontSize: "6cqw", letterSpacing: "0.12em" }}>
            Constancia
          </h1>
          <div className="flex items-center" style={{ gap: "1cqw", marginTop: "0.9cqw" }}>
            <span style={{ height: "0.22cqw", width: "5cqw", background: ROJO }} />
            <p className="font-brand uppercase" style={{ fontSize: "1.5cqw", letterSpacing: "0.42em", color: CIAN }}>de culminación</p>
          </div>
        </div>

        <p className="text-gray-600" style={{ fontSize: "1.32cqw", marginTop: "2.6cqw" }}>
          <b className="text-[#0d0d0d]">Soluciones Integrales JB</b> hace constar que:
        </p>
        <p className="font-bold leading-tight text-[#0d0d0d]" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "3.7cqw", marginTop: "0.5cqw" }}>
          {cert.studentName}
        </p>
        <div style={{ height: "0.18cqw", width: "100%", marginTop: "0.5cqw", background: `linear-gradient(90deg, ${CIAN}, ${CIAN} 60%, transparent)` }} />
        {cert.document && (
          <p className="text-gray-600" style={{ fontSize: "1.15cqw", marginTop: "0.6cqw" }}>
            Identificado(a) con <b className="text-[#0d0d0d]">{cert.document}</b>
          </p>
        )}

        <p className="text-gray-700" style={{ fontSize: "1.32cqw", marginTop: "1.8cqw" }}>ha culminado satisfactoriamente el curso</p>
        <p className="font-brand uppercase leading-tight" style={{ fontSize: "2.5cqw", color: "#0093B5", marginTop: "0.5cqw", letterSpacing: "0.02em" }}>
          {cert.courseName}
        </p>

        <div className="flex flex-wrap" style={{ gap: "0.7cqw", marginTop: "1.4cqw" }}>
          {detalles.map((d) => (
            <span key={d} className="rounded-full font-semibold" style={{ fontSize: "0.95cqw", padding: "0.35cqw 1.1cqw", background: "#eefbfe", color: "#0b5c74", border: "0.1cqw solid rgba(0,192,231,.45)" }}>
              {d}
            </span>
          ))}
        </div>

        {/* Pie: lugar y fecha · sello · firma */}
        <div className="mt-auto grid items-end" style={{ gridTemplateColumns: "1fr auto 1fr", gap: "2cqw", paddingBottom: "3cqw" }}>
          <div>
            <p className="uppercase text-gray-500" style={{ fontSize: "0.82cqw", letterSpacing: "0.2em" }}>Lugar y fecha</p>
            <p className="font-semibold text-[#0d0d0d]" style={{ fontSize: "1.2cqw", marginTop: "0.3cqw" }}>Chancay, Lima, Perú</p>
            <p className="text-gray-600" style={{ fontSize: "1.1cqw" }}>{fecha}</p>
          </div>
          <div style={{ width: "10.5cqw", height: "10.5cqw" }}><Sello /></div>
          <div className="flex flex-col items-center">
            <div className="flex items-end justify-center" style={{ height: "4.6cqw", width: "20cqw" }}>
              {hayFirma && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={firma.imagen} alt="Firma" onError={() => setHayFirma(false)} style={{ maxHeight: "4.6cqw", maxWidth: "19cqw", objectFit: "contain" }} />
              )}
            </div>
            <div className="bg-[#111111]" style={{ height: "0.12cqw", width: "20cqw" }} />
            {firma.nombre && <p className="font-bold" style={{ fontSize: "1.1cqw", marginTop: "0.45cqw" }}>{firma.nombre}</p>}
            <p className="font-brand uppercase" style={{ fontSize: "1cqw", letterSpacing: "0.12em", color: "#0093B5", marginTop: firma.nombre ? "0.1cqw" : "0.45cqw" }}>{firma.cargo}</p>
            <p className="text-gray-600" style={{ fontSize: "0.92cqw" }}>{firma.empresa}</p>
          </div>
        </div>
      </div>

      {/* Franja inferior */}
      <div className="absolute bottom-0 right-0 flex" style={{ left: "27cqw", height: "0.75cqw" }}>
        <div className="flex-1" style={{ background: CIAN }} />
        <div style={{ width: "18cqw", background: ROJO }} />
        <div style={{ width: "5cqw", background: "#111111" }} />
      </div>
    </div>
  );
}
