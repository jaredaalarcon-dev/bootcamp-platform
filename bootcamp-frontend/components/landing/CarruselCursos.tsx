// src/components/landing/CarruselCursos.tsx
// Carrusel 3D de cursos: se arrastra con el mouse o el dedo, tiene inercia,
// se acomoda solo en la tarjeta más cercana y avanza solo cada pocos segundos.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Stars } from "@/components/ui/Stars";

export interface CursoCarrusel {
  id: string;
  title: string;
  description?: string;
  image?: string | null;
  category?: { name: string } | null;
  rating?: { promedio: number; total: number } | null;
}

const ancho = (w: number) => (w < 480 ? 250 : w < 1024 ? 290 : 320);

export function CarruselCursos({ cursos }: { cursos: CursoCarrusel[] }) {
  const n = cursos.length;
  const [pos, setPos] = useState(0);             // posición continua (0 = primera tarjeta)
  const [w, setW] = useState(1200);
  const posRef = useRef(0);
  const vel = useRef(0);
  const arrastre = useRef<{ x: number; t: number; movio: boolean } | null>(null);
  const anim = useRef(0);
  const pausa = useRef(false);
  const visible = useRef(true);
  const caja = useRef<HTMLDivElement>(null);
  const reducir = useRef(false);
  const ultimoMovio = useRef(false);

  const aplicar = (p: number) => { posRef.current = p; setPos(p); };

  // Animación hacia la tarjeta más cercana (o una elegida)
  const irA = useCallback((destino: number) => {
    cancelAnimationFrame(anim.current);
    if (reducir.current) { aplicar(destino); return; }
    const paso = () => {
      const d = destino - posRef.current;
      if (Math.abs(d) < 0.001) { aplicar(destino); return; }
      aplicar(posRef.current + d * 0.14);
      anim.current = requestAnimationFrame(paso);
    };
    anim.current = requestAnimationFrame(paso);
  }, []);

  const inercia = useCallback(() => {
    cancelAnimationFrame(anim.current);
    const paso = () => {
      vel.current *= 0.92;
      if (Math.abs(vel.current) < 0.004) { irA(Math.round(posRef.current)); return; }
      aplicar(posRef.current + vel.current);
      anim.current = requestAnimationFrame(paso);
    };
    anim.current = requestAnimationFrame(paso);
  }, [irA]);

  useEffect(() => {
    reducir.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const medir = () => setW(window.innerWidth);
    medir();
    window.addEventListener("resize", medir);
    const io = new IntersectionObserver(([e]) => { visible.current = e.isIntersecting; });
    if (caja.current) io.observe(caja.current);
    return () => { window.removeEventListener("resize", medir); io.disconnect(); cancelAnimationFrame(anim.current); };
  }, []);

  // Avanza solo
  useEffect(() => {
    if (n < 2) return;
    const t = setInterval(() => {
      if (!pausa.current && !arrastre.current && visible.current && !document.hidden && !reducir.current) irA(Math.round(posRef.current) + 1);
    }, 4200);
    return () => clearInterval(t);
  }, [n, irA]);

  if (!n) return null;

  const W = ancho(w);
  const activo = ((Math.round(pos) % n) + n) % n;

  const abajo = (e: React.PointerEvent) => {
    cancelAnimationFrame(anim.current);
    arrastre.current = { x: e.clientX, t: performance.now(), movio: false };
    vel.current = 0;
  };
  const mover = (e: React.PointerEvent) => {
    const a = arrastre.current;
    if (!a) return;
    const dx = e.clientX - a.x;
    if (Math.abs(dx) > 4) a.movio = true;
    const ahora = performance.now();
    const delta = -dx / (W * 0.75);
    vel.current = delta / Math.max(1, (ahora - a.t) / 16);
    a.x = e.clientX; a.t = ahora;
    aplicar(posRef.current + delta);
  };
  const soltar = () => {
    const a = arrastre.current;
    arrastre.current = null;
    if (!a) return;
    ultimoMovio.current = a.movio;
    if (a.movio) inercia(); else irA(Math.round(posRef.current));
  };

  return (
    <div
      ref={caja}
      className="relative select-none"
      onMouseEnter={() => (pausa.current = true)}
      onMouseLeave={() => (pausa.current = false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") irA(Math.round(posRef.current) + 1);
        if (e.key === "ArrowLeft") irA(Math.round(posRef.current) - 1);
      }}
      tabIndex={0}
      role="region"
      aria-roledescription="carrusel"
      aria-label="Cursos disponibles. Usa las flechas para moverte."
    >
      <div
        className="relative mx-auto cursor-grab active:cursor-grabbing"
        style={{ height: W * 1.38, perspective: 1400, touchAction: "pan-y" }}
        onPointerDown={abajo}
        onPointerMove={mover}
        onPointerUp={soltar}
        onPointerCancel={soltar}
        onPointerLeave={() => arrastre.current && soltar()}
      >
        {cursos.map((c, i) => {
          // distancia circular a la posición actual
          let off = i - (((pos % n) + n) % n);
          if (off > n / 2) off -= n;
          if (off < -n / 2) off += n;
          const abs = Math.abs(off);
          if (abs > 3.2) return null;
          const esActivo = i === activo;
          return (
            <div
              key={c.id}
              className="absolute left-1/2 top-0"
              style={{
                width: W,
                marginLeft: -W / 2,
                transform: `translateX(${off * W * (w < 640 ? 0.56 : 0.68)}px) translateZ(${-abs * 210}px) rotateY(${-off * 34}deg)`,
                zIndex: 100 - Math.round(abs * 10),
                opacity: abs > 2.4 ? Math.max(0, 1 - (abs - 2.4) * 1.3) : 1,
                transition: "box-shadow .3s",
                pointerEvents: abs > 0.6 ? "none" : "auto",
              }}
              aria-hidden={!esActivo}
            >
              <article className={`lp-curso keep-theme group relative overflow-hidden rounded-[26px] ${esActivo ? "lp-curso-activo" : ""}`} style={{ height: W * 1.32 }}>
                {c.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <div className="absolute inset-0 lp-curso-sinimagen" />
                )}
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(7,11,20,.05) 30%, rgba(7,11,20,.88) 66%, #070b14 100%)" }} />
                <div className="absolute inset-x-0 bottom-0 p-5 text-left">
                  {c.category?.name && (
                    <span className="inline-block rounded-full bg-[#00C0E7] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0d0d0d]">
                      {c.category.name}
                    </span>
                  )}
                  <h3 className="mt-2 font-brand text-white text-xl uppercase leading-tight line-clamp-2">{c.title}</h3>
                  {c.description && <p className="mt-1.5 text-[13px] text-gray-300 line-clamp-2">{c.description}</p>}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    {c.rating && c.rating.total > 0 ? (
                      <span className="flex items-center gap-1 text-xs text-gray-300">
                        <b className="text-[#F5B301]">{c.rating.promedio.toFixed(1)}</b>
                        <Stars value={c.rating.promedio} size={12} />
                        <span className="text-gray-400">({c.rating.total})</span>
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-[#7fe3f7]">Nuevo</span>
                    )}
                    <Link
                      href={`/courses/${c.id}`}
                      tabIndex={esActivo ? 0 : -1}
                      onClick={(e) => { if (!esActivo || ultimoMovio.current) e.preventDefault(); }}
                      className="rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur hover:bg-[#E31E24] transition-colors"
                    >
                      Ver curso →
                    </Link>
                  </div>
                </div>
              </article>
            </div>
          );
        })}
      </div>

      {/* Controles */}
      {n > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button onClick={() => irA(Math.round(posRef.current) - 1)} aria-label="Curso anterior" className="lp-flecha">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex gap-1.5">
            {cursos.map((c, i) => (
              <button
                key={c.id}
                onClick={() => {
                  const base = Math.round(posRef.current);
                  let d = i - (((base % n) + n) % n);
                  if (d > n / 2) d -= n;
                  if (d < -n / 2) d += n;
                  irA(base + d);
                }}
                aria-label={`Ir a ${c.title}`}
                className={`h-2 rounded-full transition-all ${i === activo ? "w-7 bg-[#00C0E7]" : "w-2 bg-gray-600 hover:bg-gray-400"}`}
              />
            ))}
          </div>
          <button onClick={() => irA(Math.round(posRef.current) + 1)} aria-label="Curso siguiente" className="lp-flecha">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}
