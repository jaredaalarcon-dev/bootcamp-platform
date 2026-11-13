// src/components/assistant/DotOrb.tsx
// Esfera de puntos de JB Assist (inspirada en "ai-thinking-orb").
// Canvas 2D: los puntos giran sobre una esfera; al "pensar" gira más rápido
// y unas bandas de luz recorren la superficie. Colores de la marca.
"use client";

import { useEffect, useRef } from "react";

const TAU = Math.PI * 2;
const RINGS = 16;

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Puntos repartidos en anillos sobre una esfera de radio 1
const PUNTOS = (() => {
  const rand = mulberry32(7);
  const out: { x: number; y: number; z: number; seed: number }[] = [];
  for (let k = 0; k < RINGS; k++) {
    const y = 1 - ((k + 0.5) / RINGS) * 2;
    const r = Math.sqrt(1 - y * y);
    const m = Math.max(4, Math.round(30 * r));
    for (let j = 0; j < m; j++) {
      const a = (j / m) * TAU + k * 0.35;
      out.push({ x: Math.cos(a) * r, y, z: Math.sin(a) * r, seed: rand() * TAU });
    }
  }
  return out;
})();

export type EstadoOrb = "idle" | "thinking";

export function DotOrb({
  size = 120,
  state = "idle",
  light = false,
  className = "",
}: {
  size?: number;
  state?: EstadoOrb;
  light?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const estado = useRef(state);
  const claro = useRef(light);
  estado.current = state;
  claro.current = light;

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const R = size * 0.4;
    const C = size / 2;
    const inclinacion = 0.35;
    const cp = Math.cos(inclinacion), sp = Math.sin(inclinacion);
    const brillo = new Float32Array(PUNTOS.length);
    let rot = 0, vel = 0.25, energia = 0, t = reducir ? 1.2 : 0;
    let raf = 0, ultimo = performance.now();

    const dibujar = (dt: number) => {
      const pensando = estado.current === "thinking";
      // La velocidad y la energía se acercan suavemente a su objetivo
      vel += ((pensando ? 1.4 : 0.25) - vel) * Math.min(1, dt * 3);
      energia += ((pensando ? 1 : 0) - energia) * Math.min(1, dt * 4);
      rot += vel * dt;
      t += dt;

      const [r0, g0, b0] = claro.current ? [8, 145, 178] : [0, 192, 231]; // cian de marca
      const [r1, g1, b1] = claro.current ? [15, 23, 42] : [235, 251, 255]; // destello
      ctx.clearRect(0, 0, size, size);

      const cy = Math.cos(rot), sy = Math.sin(rot);
      // Dos "focos" que recorren la esfera mientras piensa
      const a1 = t * 1.1, b1v = Math.sin(t * 0.7) * 0.9;
      const f1 = [Math.cos(b1v) * Math.cos(a1), Math.sin(b1v), Math.cos(b1v) * Math.sin(a1)];
      const banda = Math.sin(t * 2.4); // franja horizontal que sube y baja
      const decay = Math.exp(-dt / 0.45);

      const lista: { x: number; y: number; r: number; a: number; hl: number; d: number }[] = [];
      PUNTOS.forEach((p, n) => {
        const x1 = p.x * cy + p.z * sy;
        const z1 = -p.x * sy + p.z * cy;
        const y2 = p.y * cp - z1 * sp;
        const z2 = p.y * sp + z1 * cp;
        const f = 2.8 / (2.8 - z2);
        const prof = (z2 + 1) / 2; // 0 atrás, 1 adelante

        let luz = 0;
        if (energia > 0.01) {
          const v1 = Math.max(0, (p.x * f1[0] + p.y * f1[1] + p.z * f1[2] - 0.7) / 0.3);
          const e = p.y - banda;
          const v2 = Math.max(0, 1 - (e * e) / 0.025);
          luz = Math.max(v1 * v1, v2 * v2 * 0.8) * energia;
        }
        brillo[n] = Math.max(brillo[n] * decay, luz);
        const l = brillo[n];

        const respira = 0.04 * Math.sin(p.seed + t * 1.6);
        const alfa = Math.min(1, 0.12 + respira + 0.42 * prof * prof + 0.7 * l);
        const radio = (size / 120) * (1.05 * (0.45 + 0.75 * prof) * f + 0.9 * l);
        lista.push({ x: C + x1 * R * f, y: C - y2 * R * f, r: radio, a: alfa, hl: l, d: prof });
      });

      // Primero los puntos de atrás, luego los de adelante
      lista.sort((a, b) => a.d - b.d);
      for (const p of lista) {
        const k = Math.min(1, p.hl * 1.2);
        const r = Math.round(r0 + (r1 - r0) * k), g = Math.round(g0 + (g1 - g0) * k), b = Math.round(b0 + (b1 - b0) * k);
        ctx.fillStyle = `rgba(${r},${g},${b},${p.a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.4, p.r), 0, TAU);
        ctx.fill();
      }
    };

    const frame = (ahora: number) => {
      const dt = Math.min(0.05, (ahora - ultimo) / 1000);
      ultimo = ahora;
      dibujar(reducir ? 0 : dt);
      if (!reducir) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return <canvas ref={ref} className={className} style={{ width: size, height: size }} aria-hidden="true" />;
}
