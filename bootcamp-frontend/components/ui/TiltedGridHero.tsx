// src/components/ui/TiltedGridHero.tsx
// Hero con una fila de imágenes que gira sobre un cilindro: entran curvadas
// por un borde, se aplanan al centro y se desvanecen por el otro.
// Adaptado del componente "tilted-grid-hero" para el proyecto
// (sin shadcn: usa @/lib/utils y los colores de la marca).
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ── La fila curva ────────────────────────────────────────────────────────
 * Cada tarjeta se corta en SLICES tiras verticales; cada tira es una cara
 * plana del cilindro. La tarjeta completa (preserve-3d) es la que gira con
 * una sola animación, así sus tiras nunca se separan. Todo es transform en
 * el compositor; el desvanecido de los bordes es una máscara fija.
 * ───────────────────────────────────────────────────────────────────────── */

const SLICES = 16;
const CAMERA = 1.6;
const MAX_WIDTH = 55;

function arc(bend: number) {
  return (CAMERA - 1 + Math.cos(bend)) / (2 * CAMERA * Math.sin(bend));
}

function measure(width: number, height: number, tile: number, aspect: number, gap: number, bend: number) {
  const h = Math.min((tile / 100) * height, ((MAX_WIDTH / 100) * width) / aspect);
  const radius = width * arc(bend);
  if (!(h > 0) || !(radius > 0)) return { columns: 2, sweep: 0, unit: 0, limit: 0 };

  const deg = (rad: number) => (rad * 180) / Math.PI;
  const unit = deg(h / radius);
  const pitch = (aspect + gap / 100) * unit;
  const limit = deg(bend) + (aspect * unit) / 2;
  // Tope para que un hero muy angosto no monte miles de tarjetas
  const columns = Math.min(60, Math.max(2, Math.ceil((2 * limit) / pitch)));
  const round = (n: number) => +n.toFixed(4);
  const sweep = round((columns * pitch) / 2);
  return { columns, sweep, unit: round(unit), limit: round(Math.min(sweep, limit)) };
}

export type TiltedGridImage = { src: string; alt?: string };

export type TiltedGridHeroProps = {
  /** Imágenes en orden; si son pocas se repiten. */
  images: TiltedGridImage[];
  /** Segundos que tarda la fila en avanzar una tarjeta. @default 4 */
  speed?: number;
  /** Alto de la tarjeta en % del alto del hero. @default 26 */
  tileHeight?: number;
  /** Ancho / alto de la tarjeta. @default 16/9 */
  aspectRatio?: number;
  /** Espacio entre tarjetas, en % de su alto. @default 6 */
  gap?: number;
  /** Centro vertical de la fila, en % del alto. @default 56 */
  axis?: number;
  /** Curvatura en grados (5–85). @default 80 */
  curve?: number;
  /** Ancho del desvanecido en cada borde, en %. @default 12 */
  fade?: number;
  children?: React.ReactNode;
  className?: string;
};

export function TiltedGridHero({
  images,
  speed = 4,
  tileHeight = 26,
  aspectRatio = 16 / 9,
  gap = 6,
  axis = 56,
  curve = 80,
  fade = 12,
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & TiltedGridHeroProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const orbit = `tgh-o-${id}`;
  const tile = `tgh-t-${id}`;
  const bend = (Math.min(85, Math.max(5, curve)) * Math.PI) / 180;

  // Nulo hasta medir el hero: así nunca se ve un primer cuadro mal calculado
  const [layout, setLayout] = React.useState<ReturnType<typeof measure> | null>(null);
  // Imagen que muestra cada tarjeta; solo cambia cuando la tarjeta da la vuelta (fuera de vista)
  const [shown, setShown] = React.useState<Record<number, number>>({});
  // Imágenes que no cargaron: se ocultan y se ve el fondo de la tarjeta
  const [rotas, setRotas] = React.useState<Record<string, true>>({});

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const next = measure(width, height, tileHeight, aspectRatio, gap, bend);
      setLayout((prev) =>
        prev?.columns === next.columns && prev.sweep === next.sweep && prev.unit === next.unit ? prev : next,
      );
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [tileHeight, aspectRatio, gap, bend]);

  // Precarga todas las imágenes
  React.useEffect(() => {
    for (const { src } of images) {
      const im = new Image();
      im.onerror = () => setRotas((p) => ({ ...p, [src]: true }));
      im.src = src;
    }
  }, [images]);

  const { columns, sweep, unit, limit } = layout ?? measure(1200, 560, tileHeight, aspectRatio, gap, bend);

  const u = (n: number) =>
    `calc(${+n.toFixed(4)} * min(${tileHeight}cqh, ${+(MAX_WIDTH / aspectRatio).toFixed(4)}cqw))`;

  const r = 100 * arc(bend);
  const radius = `${+r.toFixed(3)}cqw`;
  const turn = (deg: number) => `translateZ(${radius}) rotateY(${+deg.toFixed(4)}deg) translateZ(-${radius})`;

  const hide = +(((sweep - limit) / (2 * sweep || 1)) * 100).toFixed(4);
  const css =
    `@keyframes ${orbit}{` +
    `from{transform:${turn(-sweep)}}to{transform:${turn(sweep)}}` +
    `0%,${hide}%,${100 - hide}%,100%{visibility:hidden}` +
    `${hide + 0.001}%,${100 - hide - 0.001}%{visibility:visible}}` +
    `@media(prefers-reduced-motion:reduce){.${tile}{animation-play-state:paused}}`;

  const share = aspectRatio / SLICES;
  const duration = columns * speed;
  const mask = `linear-gradient(90deg,transparent,#000 ${fade}%,#000 ${100 - fade}%,transparent)`;
  const lista = images.filter((i) => !rotas[i.src]);

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)} {...props} style={{ containerType: "size", ...props.style }}>
      <style>{css}</style>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: layout ? 1 : 0,
          perspective: `${+(r * CAMERA).toFixed(3)}cqw`,
          perspectiveOrigin: `50% ${axis}%`,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      >
        {Array.from({ length: columns }, (_, t) => {
          const first = columns - 1 - t;
          const img = lista[(shown[t] ?? first) % Math.max(lista.length, 1)];
          return (
            <div
              key={t}
              className={cn(tile, "absolute")}
              style={{
                left: `calc(50% - ${u(aspectRatio / 2)})`,
                top: `calc(${axis}% - ${u(0.5)})`,
                width: u(aspectRatio),
                height: u(1),
                transformStyle: "preserve-3d",
                animation: `${orbit} ${duration}s linear ${-t * speed}s infinite`,
              }}
              onAnimationIteration={(e) => {
                const lap = Math.round(e.elapsedTime / duration);
                setShown((prev) => {
                  const next = lap * columns + first;
                  return prev[t] === next ? prev : { ...prev, [t]: next };
                });
              }}
            >
              {Array.from({ length: SLICES }, (_, k) => (
                <div
                  key={k}
                  className={cn(
                    "absolute top-0 overflow-hidden bg-gradient-to-br from-[#0f2a3f] to-[#111827]",
                    k === 0 && "rounded-l-lg",
                    k === SLICES - 1 && "rounded-r-lg",
                  )}
                  style={{
                    left: u((aspectRatio - share) / 2),
                    width: k === SLICES - 1 ? u(share) : `calc(${u(share)} + 1px)`,
                    height: u(1),
                    transform: turn((aspectRatio / 2 - (k + 0.5) * share) * unit),
                  }}
                >
                  {img ? (
                    <img
                      src={img.src}
                      alt={k === 0 ? (img.alt ?? "") : ""}
                      draggable={false}
                      className="absolute top-0 max-w-none object-cover"
                      style={{ left: u(-k * share), width: u(aspectRatio), height: u(1) }}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {children}
    </div>
  );
}

export default TiltedGridHero;
