// src/components/ui/AnimatedAuth.tsx
// Diseño animado para Login, Registro y Login de administración.
// Inspirado en "modern-animated-sign-in", adaptado a la marca de
// Soluciones Integrales JB y SIN librerías extra (todo con CSS + React):
//  - AuthShell:   pantalla dividida; a la izquierda el panel animado
//                 (ondas + íconos orbitando el cubo de la marca), a la derecha el formulario.
//  - Reveal:      el texto aparece con una franja de color que se desliza.
//  - GlowField:   halo de luz cian que sigue al mouse alrededor del input.
//  - AuthInput / PasswordInput (con botón ver/ocultar) / AuthLabel / BottomGradient.
"use client";

import { forwardRef, useState } from "react";
import { BrandLogo } from "@/components/ui/BrandLogo";

// Cubo con birrete de la marca (centro del panel animado)
const CUBO_SRC = "/brand/cubo-gorro.png";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";

type Variante = "student" | "admin";

// ── Íconos de las áreas de la empresa (dibujados, sin logos de terceros) ──
const ICONOS: Record<string, React.ReactNode> = {
  codigo: <path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" />,
  ia: <><path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" /><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" /></>,
  escudo: <><path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" /></>,
  datos: <><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" /></>,
  rayo: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  movil: <><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M11 18.5h2" /></>,
  nube: <path d="M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.2 9.1 4.5 4.5 0 0 0 7 18z" />,
  birrete: <><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c2 2 10 2 12 0v-5M22 9v6" /></>,
  certificado: <><circle cx="12" cy="9" r="5" /><path d="M9 13.5L8 21l4-2 4 2-1-7.5" /></>,
};

interface Orbita { icono: keyof typeof ICONOS; radio: number; duracion: number; retraso: number; tam: number; reverso?: boolean; color: string }

const ORBITAS: Orbita[] = [
  { icono: "codigo",      radio: 120, duracion: 22, retraso: 0,  tam: 46, color: "#00C0E7" },
  { icono: "ia",          radio: 120, duracion: 22, retraso: 11, tam: 46, color: "#ffffff" },
  { icono: "escudo",      radio: 190, duracion: 30, retraso: 0,  tam: 50, color: "#E31E24", reverso: true },
  { icono: "datos",       radio: 190, duracion: 30, retraso: 10, tam: 50, color: "#00C0E7", reverso: true },
  { icono: "rayo",        radio: 190, duracion: 30, retraso: 20, tam: 50, color: "#ffffff", reverso: true },
  { icono: "movil",       radio: 265, duracion: 40, retraso: 0,  tam: 54, color: "#00C0E7" },
  { icono: "birrete",     radio: 265, duracion: 40, retraso: 13, tam: 54, color: "#E31E24" },
  { icono: "nube",        radio: 265, duracion: 40, retraso: 26, tam: 54, color: "#ffffff" },
];

// ── Reveal: aparece de abajo hacia arriba con una franja que se desliza ──
export function Reveal({
  children,
  delay = 0,
  color = "#00C0E7",
  className,
  full = false,
}: {
  children: React.ReactNode;
  delay?: number;
  color?: string;
  className?: string;
  full?: boolean;
}) {
  return (
    <div className={cn("auth-reveal relative overflow-hidden", full ? "w-full" : "w-fit", className)}
      style={{ ["--d" as string]: `${delay}s`, ["--c" as string]: color } as React.CSSProperties}>
      <div className="auth-reveal-in">{children}</div>
      <span aria-hidden className="auth-reveal-box" />
    </div>
  );
}

// ── Línea de luz bajo los botones al pasar el mouse ──
export function BottomGradient() {
  return (
    <>
      <span className="pointer-events-none absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-[#00C0E7] to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="pointer-events-none absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
}

// ── Halo que sigue al mouse alrededor del campo ──
export function GlowField({ children, className }: { children: React.ReactNode; className?: string }) {
  const [pos, setPos] = useState({ x: 0, y: 0, visible: false });
  return (
    <div
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setPos({ x: e.clientX - r.left, y: e.clientY - r.top, visible: true });
      }}
      onMouseLeave={() => setPos((p) => ({ ...p, visible: false }))}
      className={cn("group/input relative rounded-lg p-[2px] transition duration-300", className)}
      style={{
        background: `radial-gradient(${pos.visible ? "110px" : "0px"} circle at ${pos.x}px ${pos.y}px, #00C0E7, transparent 80%)`,
      }}
    >
      {children}
    </div>
  );
}

// ── Inputs ──
export const AuthInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function AuthInput({ className, ...props }, ref) {
    return (
      <GlowField>
        <input ref={ref} {...props} className={cn("input-auth", className)} />
      </GlowField>
    );
  },
);

export const PasswordInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function PasswordInput({ className, ...props }, ref) {
    const [ver, setVer] = useState(false);
    return (
      <GlowField>
        <div className="relative">
          <input ref={ref} {...props} type={ver ? "text" : "password"} className={cn("input-auth pr-11", className)} />
          <button
            type="button"
            onClick={() => setVer((v) => !v)}
            aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
            title={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-[#00C0E7] transition-colors"
          >
            {ver ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A9.8 9.8 0 0112 5c6.4 0 10 7 10 7a17.6 17.6 0 01-3.2 4.2M6.6 6.6C3.9 8.4 2 12 2 12s3.6 7 10 7a9.6 9.6 0 005.4-1.6" /></svg>
            )}
          </button>
        </div>
      </GlowField>
    );
  },
);

export function AuthLabel({ htmlFor, children, required = true }: { htmlFor?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-gray-300">
      {children} {required && <span className="text-[#E31E24]">*</span>}
    </label>
  );
}

// ── Panel animado de la izquierda ──
function PanelMarca({ variante, titulo, resaltado, texto }: { variante: Variante; titulo: string; resaltado: string; texto?: string }) {
  const acento = variante === "admin" ? "#E31E24" : "#00C0E7";
  return (
    <div className="keep-theme relative hidden lg:flex lg:w-1/2 flex-col overflow-hidden bg-[#070b14]">
      {/* Fondo */}
      <div className="absolute inset-0" style={{
        background: `radial-gradient(700px 520px at 50% 45%, ${variante === "admin" ? "rgba(227,30,36,0.16)" : "rgba(0,192,231,0.18)"}, transparent 70%), radial-gradient(500px 400px at 100% 100%, rgba(227,30,36,0.14), transparent 70%), linear-gradient(160deg, #0a1120, #070b14 60%)`,
      }} />
      <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(#00C0E7 1px, transparent 1px), linear-gradient(90deg, #00C0E7 1px, transparent 1px)", backgroundSize: "56px 56px", maskImage: "radial-gradient(ellipse at center, #000 30%, transparent 75%)", WebkitMaskImage: "radial-gradient(ellipse at center, #000 30%, transparent 75%)" }} />

      {/* Encabezado */}
      <div className="relative z-10 flex items-center justify-between px-10 pt-9">
        <span className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em]"
          style={{ borderColor: `${acento}66`, color: acento, background: `${acento}14` }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: acento, boxShadow: `0 0 10px ${acento}` }} />
          {variante === "admin" ? "Acceso administrativo" : "Plataforma de cursos"}
        </span>
      </div>

      {/* Ondas + órbitas */}
      <div className="relative flex-1">
        <div className="absolute left-1/2 top-1/2 h-0 w-0">
          {/* Ondas */}
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i} className="auth-ripple absolute rounded-full border"
              style={{
                width: 130 + i * 74, height: 130 + i * 74,
                borderColor: `${acento}${Math.max(8, 40 - i * 4).toString(16).padStart(2, "0")}`,
                borderStyle: i === 7 ? "dashed" : "solid",
                background: i === 0 ? `${acento}10` : "transparent",
                animationDelay: `${i * 0.08}s`,
              }} />
          ))}

          {/* Íconos en órbita */}
          {ORBITAS.map((o, i) => (
            <div key={i} className="auth-orbit absolute"
              style={{
                ["--radius" as string]: `${o.radio}px`,
                ["--duration" as string]: `${o.duracion}s`,
                animationDelay: `-${o.retraso}s`,
                animationDirection: o.reverso ? "reverse" : "normal",
                width: o.tam, height: o.tam, marginLeft: -o.tam / 2, marginTop: -o.tam / 2,
              } as React.CSSProperties}>
              <div className="flex h-full w-full items-center justify-center rounded-2xl border border-white/10 bg-[#111827]/90 shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur"
                style={{ boxShadow: `0 0 0 1px ${o.color}22, 0 0 24px ${o.color}2a, 0 10px 30px rgba(0,0,0,.45)` }}>
                <svg viewBox="0 0 24 24" fill="none" stroke={o.color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ width: o.tam * 0.48, height: o.tam * 0.48 }}>
                  {ICONOS[o.icono]}
                </svg>
              </div>
            </div>
          ))}

          {/* Cubo de la marca al centro */}
          <div className="absolute -ml-[52px] -mt-[52px] flex h-[104px] w-[104px] items-center justify-center rounded-[28px] border border-white/10 bg-[#0d1524]"
            style={{ boxShadow: `0 0 0 8px ${acento}12, 0 0 60px ${acento}55` }}>
            <img src={CUBO_SRC} alt="" className="h-[80px] w-[80px] object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.5)]" draggable={false} />
          </div>
        </div>
      </div>

      {/* Mensaje */}
      <div className="relative z-10 px-10 pb-10">
        <h2 className="font-brand uppercase leading-[0.95] text-5xl xl:text-6xl tracking-wide">
          <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">{titulo}</span>
          <br />
          <span style={{ color: acento }}>{resaltado}</span>
        </h2>
        <div className="mt-4 h-[3px] w-16 rounded" style={{ background: variante === "admin" ? "#00C0E7" : "#E31E24" }} />
        {texto && <p className="mt-4 max-w-md text-sm text-gray-400 leading-relaxed">{texto}</p>}
      </div>
    </div>
  );
}

// ── Pantalla completa ──
export function AuthShell({
  variante = "student",
  titulo,
  subtitulo,
  panel,
  children,
  pie,
}: {
  variante?: Variante;
  titulo: string;
  subtitulo?: string;
  panel: { titulo: string; resaltado: string; texto?: string };
  children: React.ReactNode;
  pie?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] bg-[#0d0d0d]">
      <PanelMarca variante={variante} {...panel} />

      <div className="relative flex w-full lg:w-1/2 flex-col">
        <div className="absolute right-5 top-5 z-20"><ThemeToggle /></div>
        <div className="flex flex-1 items-center justify-center px-6 py-14 sm:px-[10%]">
          <div className="w-full max-w-[400px]">
            <Reveal delay={0.05}><BrandLogo width={250} /></Reveal>

            <div className="mt-8 space-y-1.5">
              <Reveal delay={0.15} color={variante === "admin" ? "#E31E24" : "#00C0E7"}>
                <h1 className="text-3xl font-bold text-white tracking-tight">{titulo}</h1>
              </Reveal>
              {subtitulo && (
                <Reveal delay={0.25}>
                  <p className="text-sm text-gray-400">{subtitulo}</p>
                </Reveal>
              )}
            </div>

            <div className="mt-7 auth-fade" style={{ ["--d" as string]: "0.35s" } as React.CSSProperties}>{children}</div>

            {pie && <div className="mt-6 auth-fade" style={{ ["--d" as string]: "0.5s" } as React.CSSProperties}>{pie}</div>}
          </div>
        </div>
        <p className="pb-6 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} Soluciones Integrales JB S.A.C. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
