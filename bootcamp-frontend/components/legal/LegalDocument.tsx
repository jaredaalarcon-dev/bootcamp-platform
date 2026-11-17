// src/components/legal/LegalDocument.tsx
// Plantilla de los documentos legales (Términos y Privacidad):
// índice lateral que marca la sección que estás leyendo, numeración y modo claro/oscuro.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { EMPRESA, SeccionLegal, TERMS_FECHA, TERMS_VERSION } from "@/lib/legal";

interface Props {
  tipo: "terminos" | "privacidad";
  titulo: string;
  intro: string;
  secciones: SeccionLegal[];
}

const DOCS = [
  { tipo: "terminos", href: "/terminos", label: "Términos y Condiciones" },
  { tipo: "privacidad", href: "/privacidad", label: "Política de Privacidad" },
] as const;

export function LegalDocument({ tipo, titulo, intro, secciones }: Props) {
  const [activa, setActiva] = useState(secciones[0]?.id);

  // Resalta en el índice la sección visible
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entradas) => {
        const visibles = entradas.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visibles[0]) setActiva(visibles[0].target.id);
      },
      { rootMargin: "-90px 0px -60% 0px" },
    );
    secciones.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [secciones]);

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      {/* Barra superior */}
      <header className="sticky top-0 z-30 border-b border-[rgba(0,192,231,0.12)] bg-[#0d0d0d] print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
          <Link href="/" aria-label="Inicio"><BrandLogo width={190} /></Link>
          <nav className="flex items-center gap-1 text-sm">
            {DOCS.map((d) => (
              <Link
                key={d.tipo}
                href={d.href}
                className={`hidden rounded-lg px-3 py-1.5 font-semibold transition-colors sm:inline ${
                  d.tipo === tipo ? "bg-[rgba(0,192,231,0.12)] text-[#00C0E7]" : "text-gray-400 hover:text-[#00C0E7]"
                }`}
              >
                {d.label}
              </Link>
            ))}
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* Encabezado del documento */}
      <section className="border-b border-gray-800">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00C0E7]">Documento legal</p>
          <h1 className="font-brand mt-3 text-3xl uppercase leading-tight text-white sm:text-5xl">{titulo}</h1>
          <div className="my-5 h-[3px] w-16 rounded bg-[#E31E24]" />
          <p className="max-w-2xl text-base leading-relaxed text-gray-400">{intro}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500">
            <span>Vigente desde el <b className="text-gray-300">{TERMS_FECHA}</b></span>
            <span>Versión <b className="text-gray-300">{TERMS_VERSION}</b></span>
            <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 font-semibold text-[#00C0E7] hover:underline print:hidden">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" /></svg>
              Imprimir o guardar PDF
            </button>
          </div>
        </div>
      </section>

      {/* Contenido */}
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 lg:grid-cols-[230px_1fr]">
        <aside className="hidden lg:block print:hidden">
          <nav className="sticky top-24">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-gray-500">Contenido</p>
            <ol className="space-y-0.5 border-l border-gray-800">
              {secciones.map((s, i) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className={`-ml-px flex gap-2 border-l-2 py-1.5 pl-3 text-[13px] leading-snug transition-colors ${
                      activa === s.id ? "border-[#00C0E7] font-semibold text-[#00C0E7]" : "border-transparent text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    <span className="tabular-nums opacity-60">{String(i + 1).padStart(2, "0")}</span>
                    {s.titulo}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <article className="max-w-3xl">
          {secciones.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-24 border-b border-gray-800 py-7 first:pt-0 last:border-0">
              <h2 className="flex items-baseline gap-3 text-lg font-semibold text-white sm:text-xl">
                <span className="font-brand text-base text-[#00C0E7] tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                {s.titulo}
              </h2>
              <div className="mt-3 space-y-3 pl-0 text-[15px] leading-relaxed text-gray-400 sm:pl-9">
                {s.parrafos?.map((p, k) => <p key={k}>{p}</p>)}
                {s.lista && (
                  <ul className="space-y-2">
                    {s.lista.map((item, k) => (
                      <li key={k} className="flex gap-3">
                        <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rotate-45 rounded-[1px] bg-[#00C0E7]" aria-hidden />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {s.nota && (
                  <p className="rounded-lg border-l-2 border-[#E31E24] bg-[rgba(227,30,36,0.06)] px-4 py-2.5 text-sm text-gray-300">{s.nota}</p>
                )}
              </div>
            </section>
          ))}

          {/* Contacto */}
          <div className="mt-8 rounded-2xl border border-[rgba(0,192,231,0.2)] bg-[rgba(0,192,231,0.05)] p-6">
            <p className="font-semibold text-white">¿Tienes preguntas sobre este documento?</p>
            <p className="mt-1 text-sm text-gray-400">Escríbenos y te responderemos lo antes posible.</p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm print:hidden">
              <a href={`mailto:${EMPRESA.correo}`} className="btn-cyan py-2 px-4 text-sm">{EMPRESA.correo}</a>
              <a href={EMPRESA.whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-lg border border-[#25D366]/40 px-4 py-2 font-semibold text-[#25D366] hover:bg-[#25D366]/10">
                WhatsApp {EMPRESA.whatsapp}
              </a>
            </div>
          </div>
          <p className="mt-6 text-xs text-gray-600">
            {EMPRESA.titular} · RUC {EMPRESA.ruc} · Nombre comercial: {EMPRESA.nombreComercial}
          </p>
        </article>
      </div>
    </div>
  );
}
