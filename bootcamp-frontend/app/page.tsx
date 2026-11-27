// src/app/page.tsx — página de inicio
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Aparecer, Inclinar, Rotativas } from "@/components/landing/efectos";

// three.js solo se descarga en el navegador y después de lo principal
const Cubo3D = dynamic(() => import("@/components/landing/Cubo3D").then((m) => m.Cubo3D), {
  ssr: false,
  // Mientras carga no se muestra ninguna imagen detrás: solo el halo de fondo
  loading: () => null,
});

const NAV = [
  { href: "#como-funciona", t: "Cómo funciona" },
  { href: "#beneficios", t: "Beneficios" },
];

const TEMAS = ["Flutter", "Inteligencia artificial", "Laravel", "n8n", "Python", "React", "Ciberseguridad", "Firebase", "Gemini", "APIs REST", "Data Science", "Automatización"];

const PASOS = [
  { n: "01", t: "Crea tu cuenta", d: "Regístrate gratis en menos de un minuto y elige tu curso.", i: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" },
  { n: "02", t: "Aprende con videos", d: "Lecciones cortas, guías en PDF y kits de práctica para descargar.", i: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { n: "03", t: "Practica y pregunta", d: "Cuestionarios en cada módulo y el equipo responde tus dudas en cada lección.", i: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { n: "04", t: "Certifícate", d: "Aprueba el examen final y descarga tu constancia con código verificable.", i: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
];

const BENEFICIOS = [
  { t: "JB Assist con IA", d: "Un asistente que responde al instante tus dudas sobre cursos, pagos y certificados.", i: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z", grande: true, color: "#00C0E7" },
  { t: "Tu progreso real", d: "Retoma donde te quedaste y mira tu avance por módulo.", i: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", color: "#E31E24" },
  { t: "Cuestionarios", d: "Repasa cada módulo con nota al instante y reintentos.", i: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", color: "#00C0E7" },
  { t: "Certificados verificables", d: "Cada documento tiene un código único que cualquiera puede comprobar en línea.", i: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", grande: true, color: "#E31E24" },
  { t: "En tu celular", d: "Diseñada para estudiar desde cualquier lugar, en modo claro u oscuro.", i: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z", color: "#00C0E7" },
  { t: "Comunidad", d: "Pregunta en cada lección y califica los cursos para ayudar a otros.", i: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", color: "#E31E24" },
];

function Icono({ d, className = "w-6 h-6" }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

export default function Home() {
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [scroll, setScroll] = useState(false);

  // Si ya tiene sesión, lo llevamos directo a su panel
  useEffect(() => {
    try {
      if (localStorage.getItem("accessToken")) router.replace("/dashboard");
    } catch {}
  }, [router]);

  useEffect(() => {
    const alScroll = () => setScroll(window.scrollY > 12);
    alScroll();
    window.addEventListener("scroll", alScroll, { passive: true });
    return () => window.removeEventListener("scroll", alScroll);
  }, []);

  return (
    <div className="lp min-h-screen flex flex-col overflow-x-clip">
      {/* Fondo animado */}
      <div className="lp-fondo" aria-hidden>
        <span className="lp-aurora lp-aurora-1" />
        <span className="lp-aurora lp-aurora-2" />
        <span className="lp-aurora lp-aurora-3" />
        <span className="lp-rejilla" />
      </div>

      {/* ── Barra superior ───────────────────────────────────────────── */}
      <header className={`lp-header sticky top-0 z-50 transition-all ${scroll ? "lp-header-scroll" : ""}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link href="/" aria-label="Inicio" className="shrink-0"><BrandLogo width={190} className="hidden sm:flex" /><BrandLogo width={150} className="sm:hidden" /></Link>
          <nav className="hidden lg:flex items-center gap-1 ml-6">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="lp-nav px-3 py-2 text-sm font-semibold rounded-lg">{n.t}</a>
            ))}
          </nav>
          <div className="flex-1" />
          <ThemeToggle />
          <Link href="/login" className="hidden sm:inline lp-nav px-3 py-2 text-sm font-semibold rounded-lg">Iniciar sesión</Link>
          <Link href="/register" className="btn-red text-sm py-2 px-4 hidden sm:inline-flex">Crear cuenta</Link>
          <button onClick={() => setMenu((m) => !m)} aria-label="Abrir menú" aria-expanded={menu} className="lg:hidden lp-nav p-2 rounded-lg">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d={menu ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
        {menu && (
          <div className="lg:hidden lp-menu mx-3 mb-3 rounded-2xl p-3 space-y-1">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setMenu(false)} className="block lp-nav px-4 py-3 rounded-xl font-semibold">{n.t}</a>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link href="/login" className="btn-cyan text-sm py-2.5 text-center">Iniciar sesión</Link>
              <Link href="/register" className="btn-red text-sm py-2.5 text-center">Crear cuenta</Link>
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10 flex-1">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-8 sm:pt-14 pb-10 grid items-center gap-6 lg:grid-cols-[1.05fr_1fr]">
          <div className="text-center lg:text-left order-2 lg:order-1">
            <Aparecer>
              <span className="lp-pill">
                <span className="lp-pill-punto" /> Tu mejor opción tecnológica
              </span>
            </Aparecer>
            <Aparecer retraso={80}>
              <h1 className="mt-5 font-brand uppercase leading-[0.92] text-[42px] sm:text-6xl xl:text-7xl lp-titulo">
                Aprende <span className="lp-degradado">tecnología</span>
                <br />que te abre puertas
              </h1>
            </Aparecer>
            <Aparecer retraso={160}>
              <p className="mt-5 text-lg sm:text-xl lp-texto">
                Cursos de <Rotativas palabras={["apps móviles con IA", "desarrollo web", "automatización con n8n", "ciberseguridad", "ciencia de datos"]} />
              </p>
              <p className="mt-2 lp-texto-suave max-w-xl mx-auto lg:mx-0">
                Videos paso a paso, práctica real, un asistente con IA y constancias verificables de Soluciones Integrales JB.
              </p>
            </Aparecer>
            <Aparecer retraso={240}>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link href="/register" className="btn-red lp-cta px-7 py-3.5 text-base">Empezar gratis →</Link>
                <a href="#como-funciona" className="btn-cyan px-7 py-3.5 text-base">Cómo funciona</a>
              </div>
            </Aparecer>
          </div>

          {/* Cubo 3D */}
          <div className="order-1 lg:order-2 relative">
            <div className="relative mx-auto aspect-square w-full max-w-[340px] sm:max-w-[480px] lg:max-w-[560px]">
              <div className="lp-halo" aria-hidden />
              <div className="lp-piso" aria-hidden />
              <div className="lp-orbita" aria-hidden><span /></div>
              <Cubo3D className="absolute inset-0" />
            </div>
            <p className="lp-pista text-center text-xs font-semibold">
              <span className="hidden sm:inline">Arrástralo con el mouse</span><span className="sm:hidden">Deslízalo con el dedo</span> para girarlo ↻
            </p>
          </div>
        </section>

        {/* ── Cinta de temas ───────────────────────────────────────────── */}
        <div className="lp-cinta" aria-hidden>
          <div className="lp-cinta-pista">
            {[...TEMAS, ...TEMAS].map((t, i) => (
              <span key={i} className="lp-cinta-item">{t}<span className="lp-cinta-sep">◆</span></span>
            ))}
          </div>
        </div>

        {/* ── Cómo funciona ───────────────────────────────────────────── */}
        <section id="como-funciona" className="scroll-mt-20 py-20 sm:py-24 lp-banda">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <Aparecer className="text-center max-w-2xl mx-auto">
              <p className="lp-eyebrow">Cómo funciona</p>
              <h2 className="lp-h2">De cero a <span className="text-[#E31E24]">certificado</span> en 4 pasos</h2>
            </Aparecer>
            <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 relative">
              <span className="lp-linea hidden lg:block" aria-hidden />
              {PASOS.map((p, i) => (
                <Aparecer key={p.n} como="li" retraso={i * 120}>
                  <div className="lp-paso relative h-full rounded-3xl p-6">
                    <div className="flex items-center gap-3">
                      <span className="lp-paso-icono"><Icono d={p.i} /></span>
                      <span className="font-brand text-4xl lp-numero">{p.n}</span>
                    </div>
                    <h3 className="mt-4 text-lg font-bold lp-titulo">{p.t}</h3>
                    <p className="mt-1.5 text-sm lp-texto-suave">{p.d}</p>
                  </div>
                </Aparecer>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Beneficios ──────────────────────────────────────────────── */}
        <section id="beneficios" className="scroll-mt-20 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <Aparecer className="text-center max-w-2xl mx-auto">
              <p className="lp-eyebrow">Todo en un solo lugar</p>
              <h2 className="lp-h2">Una plataforma hecha <span className="text-[#00C0E7]">para aprender</span></h2>
            </Aparecer>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {BENEFICIOS.map((b, i) => (
                <Aparecer key={b.t} retraso={i * 70} className={b.grande ? "lg:col-span-2" : ""}>
                  <Inclinar className="h-full">
                    <div className="lp-tarjeta h-full rounded-3xl p-6" style={{ ["--acento" as string]: b.color } as React.CSSProperties}>
                      <span className="lp-tarjeta-icono"><Icono d={b.i} /></span>
                      <h3 className="mt-4 text-lg font-bold lp-titulo">{b.t}</h3>
                      <p className="mt-1.5 text-sm lp-texto-suave">{b.d}</p>
                    </div>
                  </Inclinar>
                </Aparecer>
              ))}
            </div>
          </div>
        </section>

        {/* ── Llamado final ───────────────────────────────────────────── */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <Aparecer>
              <div className="lp-final keep-theme relative overflow-hidden rounded-[32px] px-6 py-14 sm:px-14 text-center">
                <h2 className="font-brand uppercase text-white text-4xl sm:text-6xl leading-[0.95]">
                  Tu siguiente nivel<br /><span className="text-[#00C0E7]">empieza hoy</span>
                </h2>
                <p className="mt-4 text-gray-300 max-w-xl mx-auto">Crea tu cuenta gratis y empieza a aprender ahora mismo, a tu ritmo y desde cualquier dispositivo.</p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/register" className="btn-red lp-cta px-8 py-3.5 text-base">Crear mi cuenta gratis</Link>
                  <Link href="/login" className="keep-theme rounded-lg border border-white/30 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition-colors">Ya tengo cuenta</Link>
                </div>
              </div>
            </Aparecer>
          </div>
        </section>
      </main>

      <div className="relative z-10"><SiteFooter conRuc={false} /></div>
    </div>
  );
}
