// src/components/landing/efectos.tsx — pequeños efectos de la página de inicio
"use client";

import { useEffect, useRef, useState } from "react";

/** Aparece suavemente cuando entra en pantalla. */
export function Aparecer({ children, className = "", retraso = 0, como: Tag = "div" }: {
  children: React.ReactNode; className?: string; retraso?: number; como?: "div" | "section" | "li";
}) {
  const ref = useRef<HTMLElement>(null);
  const [visto, setVisto] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisto(true); io.disconnect(); } }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement & HTMLLIElement>}
      className={`lp-aparecer ${visto ? "lp-visto" : ""} ${className}`}
      style={{ transitionDelay: `${retraso}ms` }}
    >
      {children}
    </Tag>
  );
}

/** Tarjeta que se inclina en 3D siguiendo el cursor (en celular queda quieta). */
export function Inclinar({ children, className = "", fuerza = 10 }: { children: React.ReactNode; className?: string; fuerza?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const mover = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.transform = `perspective(900px) rotateX(${-y * fuerza}deg) rotateY(${x * fuerza}deg) translateZ(0)`;
    ref.current.style.setProperty("--mx", `${(x + 0.5) * 100}%`);
    ref.current.style.setProperty("--my", `${(y + 0.5) * 100}%`);
  };
  const salir = () => { if (ref.current) ref.current.style.transform = ""; };
  return (
    <div ref={ref} onPointerMove={mover} onPointerLeave={salir} className={`lp-inclinar ${className}`}>
      {children}
    </div>
  );
}

/** Número que cuenta desde 0 cuando aparece en pantalla. */
export function Contador({ valor, sufijo = "", duracion = 1400 }: { valor: number; sufijo?: string; duracion?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const paso = (t: number) => {
        const k = Math.min(1, (t - t0) / duracion);
        setN(Math.round(valor * (1 - Math.pow(1 - k, 3))));
        if (k < 1) raf = requestAnimationFrame(paso);
      };
      raf = requestAnimationFrame(paso);
    });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [valor, duracion]);
  return <span ref={ref}>{n}{sufijo}</span>;
}

/** Palabras que se van turnando con un efecto de giro. */
export function Rotativas({ palabras, intervalo = 2400 }: { palabras: string[]; intervalo?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % palabras.length), intervalo);
    return () => clearInterval(t);
  }, [palabras.length, intervalo]);
  return (
    <span className="lp-rotativas" aria-live="polite">
      {palabras.map((p, k) => (
        <span key={p} className={`lp-rotativa ${k === i ? "lp-rotativa-on" : ""}`} aria-hidden={k !== i}>{p}</span>
      ))}
      {/* reserva el ancho de la palabra más larga */}
      <span className="invisible" aria-hidden>{palabras.reduce((a, b) => (b.length > a.length ? b : a), "")}</span>
    </span>
  );
}
