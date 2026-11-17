// src/app/admin/reports/page.tsx
// Reportes y Métricas — tablero analítico del panel admin.
// Gráficos hechos a mano en SVG (sin librerías extra) y con colores que
// cambian solos entre modo oscuro y claro (variables .rx en globals.css).
"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useAdminApi, Analytics, CourseAnalytics, Periodo } from "@/hooks/useAdminApi";

/* ═════════════════════════════ Utilidades ═════════════════════════════ */

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DIAS_LARGO = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábados", "domingos"];
const RANGOS = [
  { d: 7, l: "7 días" },
  { d: 30, l: "30 días" },
  { d: 90, l: "90 días" },
  { d: 365, l: "12 meses" },
];

const num = (n: number) => n.toLocaleString("es-PE");
const fecha = (iso: string) => {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MESES[m - 1]}`;
};
const hora = (h: number) => `${String(h).padStart(2, "0")}:00`;

/** Escala "bonita" para el eje Y: tope y marcas enteras. */
function escala(max: number) {
  const bruto = Math.max(max, 1) / 4;
  const pot = 10 ** Math.floor(Math.log10(bruto));
  const n = bruto / pot;
  const paso = Math.max(1, (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pot);
  const tope = paso * Math.max(1, Math.ceil(max / paso));
  const marcas: number[] = [];
  for (let v = 0; v <= tope + 1e-9; v += paso) marcas.push(v);
  return { tope, marcas };
}

function delta(p: Periodo) {
  if (p.anterior === 0) return p.actual > 0 ? { pct: null, dir: 1 } : { pct: 0, dir: 0 };
  const pct = Math.round(((p.actual - p.anterior) / p.anterior) * 100);
  return { pct, dir: Math.sign(pct) };
}

/** Ancho real del contenedor para que los SVG sean nítidos y responsivos. */
function useAncho<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/** Número que sube animado hasta su valor. */
function useContador(valor: number, ms = 900) {
  const [v, setV] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const reducir = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducir) { setV(valor); prev.current = valor; return; }
    const desde = prev.current;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      setV(Math.round(desde + (valor - desde) * e));
      if (k < 1) raf = requestAnimationFrame(tick);
      else prev.current = valor;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [valor, ms]);
  return v;
}

/** Brillo que sigue al cursor. */
const seguirCursor = (e: React.MouseEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
};

/* ═════════════════════════════ Piezas comunes ═════════════════════════════ */

function Tarjeta({
  titulo, sub, accion, children, className = "", delay = 0,
}: {
  titulo?: string; sub?: string; accion?: React.ReactNode; children: React.ReactNode; className?: string; delay?: number;
}) {
  return (
    <section
      onMouseMove={seguirCursor}
      className={`rx-card rx-glow rx-in min-w-0 p-5 ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {(titulo || accion) && (
        <header className="relative mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {titulo && <h3 className="text-[15px] font-semibold text-(--rx-ink)">{titulo}</h3>}
            {sub && <p className="mt-0.5 text-xs text-(--rx-ink-3)">{sub}</p>}
          </div>
          {accion}
        </header>
      )}
      <div className="relative">{children}</div>
    </section>
  );
}

function Tooltip({ x, y, ancho, children }: { x: number; y: number; ancho: number; children: React.ReactNode }) {
  // Se mantiene dentro del gráfico aunque el punto esté en un borde
  const izq = Math.min(Math.max(x, 80), Math.max(ancho - 80, 80));
  return (
    <div
      className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-(--rx-border) bg-(--rx-tip) px-3 py-2 text-xs text-(--rx-ink) shadow-xl"
      style={{ left: izq, top: y - 10 }}
    >
      {children}
    </div>
  );
}

function Delta({ p, sufijo = "vs. periodo anterior" }: { p: Periodo; sufijo?: string }) {
  const { pct, dir } = delta(p);
  const color = dir > 0 ? "text-(--rx-up)" : dir < 0 ? "text-(--rx-down)" : "text-(--rx-ink-3)";
  return (
    <p className="mt-2 flex items-center gap-1.5 text-[11px] text-(--rx-ink-3)">
      <span className={`inline-flex items-center gap-0.5 font-semibold ${color}`}>
        {dir > 0 ? "▲" : dir < 0 ? "▼" : "■"}
        {pct === null ? "Nuevo" : `${Math.abs(pct)}%`}
      </span>
      {sufijo}
    </p>
  );
}

function Vacio({ texto }: { texto: string }) {
  return (
    <div className="flex h-full min-h-[140px] flex-col items-center justify-center gap-2 text-center text-xs text-(--rx-ink-3)">
      <svg className="h-8 w-8 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 15l3-3 3 3 5-6" />
      </svg>
      {texto}
    </div>
  );
}

/* ═════════════════════════════ KPI con mini gráfico ═════════════════════════════ */

function Sparkline({ datos }: { datos: number[] }) {
  const W = 120, H = 36;
  const max = Math.max(...datos, 1);
  const pts = datos.map((v, i) => [(i / Math.max(datos.length - 1, 1)) * W, H - 3 - (v / max) * (H - 6)]);
  const linea = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("");
  const id = `sp${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-9 w-28" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--rx-accent)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--rx-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${linea}L${W},${H}L0,${H}Z`} fill={`url(#${id})`} />
      <path d={linea} fill="none" stroke="var(--rx-accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Kpi({
  titulo, periodo, serie, icono, delay,
}: { titulo: string; periodo: Periodo; serie: number[]; icono: React.ReactNode; delay: number }) {
  const v = useContador(periodo.actual);
  return (
    <div onMouseMove={seguirCursor} className="rx-card rx-glow rx-in p-4" style={{ animationDelay: `${delay}ms` }}>
      <div className="relative">
        <p className="flex items-center gap-2 truncate text-xs font-medium text-(--rx-ink-2)">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-(--rx-accent-2) text-(--rx-accent)">{icono}</span>
          <span className="truncate">{titulo}</span>
        </p>
        <div className="mt-3 flex items-end justify-between gap-3">
          <p className="text-3xl font-bold leading-none tracking-tight text-(--rx-ink) tabular-nums">{num(v)}</p>
          <Sparkline datos={serie} />
        </div>
        <Delta p={periodo} />
      </div>
    </div>
  );
}

/* ═════════════════════════════ Línea de tiempo (área) ═════════════════════════════ */

type Metrica = "enrollments" | "lessons" | "students";
const METRICAS: { k: Metrica; l: string; u: string }[] = [
  { k: "enrollments", l: "Inscripciones", u: "inscripciones" },
  { k: "lessons", l: "Lecciones completadas", u: "lecciones" },
  { k: "students", l: "Nuevos alumnos", u: "alumnos nuevos" },
];

function GraficoArea({ datos, metrica, semanal }: { datos: Analytics["timeline"]; metrica: Metrica; semanal: boolean }) {
  const [ref, W] = useAncho<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const H = 260, m = { t: 16, r: 12, b: 28, l: 36 };
  const iw = Math.max(W - m.l - m.r, 10), ih = H - m.t - m.b;
  const valores = datos.map((d) => d[metrica]);
  const { tope, marcas } = escala(Math.max(...valores, 0));
  const x = (i: number) => m.l + (datos.length <= 1 ? iw / 2 : (i / (datos.length - 1)) * iw);
  const y = (v: number) => m.t + ih - (v / tope) * ih;

  // Curva suave (monótona) para que no "invente" picos
  const pts = valores.map((v, i) => [x(i), y(v)] as const);
  let linea = "";
  pts.forEach(([px, py], i) => {
    if (i === 0) { linea += `M${px},${py}`; return; }
    const [qx, qy] = pts[i - 1];
    const cx = (qx + px) / 2;
    linea += `C${cx},${qy} ${cx},${py} ${px},${py}`;
  });
  const area = pts.length ? `${linea}L${x(pts.length - 1)},${m.t + ih}L${x(0)},${m.t + ih}Z` : "";
  const cadaEtiqueta = Math.max(1, Math.ceil(datos.length / Math.max(2, Math.floor(iw / 70))));
  const total = valores.reduce((a, b) => a + b, 0);
  const u = METRICAS.find((q) => q.k === metrica)!.u;

  const mover = (e: React.MouseEvent<SVGRectElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    const i = datos.length <= 1 ? 0 : Math.round((px / r.width) * (datos.length - 1));
    setHover(Math.max(0, Math.min(datos.length - 1, i)));
  };

  return (
    <div ref={ref} className="relative w-full">
      {W > 0 && (
        <svg width={W} height={H} role="img" aria-label={`Evolución de ${u}: ${total} en el periodo`}>
          <defs>
            <linearGradient id="rx-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--rx-accent)" stopOpacity="0.32" />
              <stop offset="100%" stopColor="var(--rx-accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {marcas.map((t) => (
            <g key={t}>
              <line x1={m.l} x2={W - m.r} y1={y(t)} y2={y(t)} stroke="var(--rx-grid)" strokeDasharray={t ? "3 4" : undefined} />
              <text x={m.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-(--rx-ink-3) text-[10px] tabular-nums">{num(t)}</text>
            </g>
          ))}
          {datos.map((d, i) => (i % cadaEtiqueta === 0 || i === datos.length - 1) && (i === datos.length - 1 || datos.length - 1 - i >= cadaEtiqueta / 2) ? (
            <text key={d.date} x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === datos.length - 1 ? "end" : "middle"} className="fill-(--rx-ink-3) text-[10px]">{fecha(d.date)}</text>
          ) : null)}
          <path d={area} fill="url(#rx-area)" className="transition-all duration-500" />
          <path d={linea} fill="none" stroke="var(--rx-accent)" strokeWidth={2} strokeLinejoin="round" className="transition-all duration-500" />
          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={m.t} y2={m.t + ih} stroke="var(--rx-ink-3)" strokeDasharray="3 3" />
              <circle cx={x(hover)} cy={y(valores[hover])} r={5} fill="var(--rx-accent)" stroke="var(--rx-surface)" strokeWidth={2} />
            </g>
          )}
          <rect x={m.l} y={m.t} width={iw} height={ih} fill="transparent" onMouseMove={mover} onMouseLeave={() => setHover(null)} />
        </svg>
      )}
      {hover !== null && datos[hover] && (
        <Tooltip x={x(hover)} y={y(valores[hover])} ancho={W}>
          <p className="text-(--rx-ink-3)">{semanal ? `Semana del ${fecha(datos[hover].date)}` : fecha(datos[hover].date)}</p>
          <p className="mt-0.5 font-semibold"><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-(--rx-accent)" />{num(valores[hover])} {u}</p>
        </Tooltip>
      )}
    </div>
  );
}

/* ═════════════════════════════ Medidor (salud) ═════════════════════════════ */

function Medidor({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  const v = useContador(valor, 1100);
  const R = 70, C = 2 * Math.PI * R, arco = C * 0.75;
  return (
    <div className="relative mx-auto h-[170px] w-[170px]">
      <svg viewBox="0 0 180 180" className="h-full w-full -rotate-[225deg]" aria-label={`${etiqueta}: ${valor}%`} role="img">
        <defs>
          <linearGradient id="rx-gauge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--rx-accent)" />
            <stop offset="100%" stopColor="var(--rx-done)" />
          </linearGradient>
        </defs>
        <circle cx="90" cy="90" r={R} fill="none" stroke="var(--rx-cell)" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${arco} ${C}`} />
        <circle cx="90" cy="90" r={R} fill="none" stroke="url(#rx-gauge)" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${(arco * Math.min(v, 100)) / 100} ${C}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold tabular-nums text-(--rx-ink)">{v}%</span>
        <span className="mt-0.5 text-[11px] text-(--rx-ink-3)">{etiqueta}</span>
      </div>
    </div>
  );
}

/* ═════════════════════════════ Barras verticales ═════════════════════════════ */

function Barras({ cursos, todos }: { cursos: CourseAnalytics[]; todos: boolean }) {
  const [ref, W] = useAncho<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const [scroll, setScroll] = useState(0);
  const lista = todos ? cursos : cursos.slice(0, 6);
  const H = 290, m = { t: 26, r: 8, b: 60, l: 32 };
  const minPorBarra = 84;
  const ancho = Math.max(W, m.l + m.r + lista.length * minPorBarra);
  const iw = ancho - m.l - m.r, ih = H - m.t - m.b;
  const { tope, marcas } = escala(Math.max(...lista.map((c) => c.enrollments), 0));
  const banda = iw / Math.max(lista.length, 1);
  const bw = Math.min(46, banda * 0.56);
  const y = (v: number) => m.t + ih - (v / tope) * ih;
  const corto = (t: string, n: number) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);
  const maxChars = Math.max(8, Math.floor((banda - 8) / 6.4));
  // Parte el título en dos líneas (por palabras) para que no choquen
  const lineas = (t: string) => {
    const pal = t.split(" ");
    let a = "";
    while (pal.length && (a + " " + pal[0]).trim().length <= maxChars) a = (a + " " + pal.shift()).trim();
    if (!a) a = pal.shift() ?? "";
    return [corto(a, maxChars), pal.length ? corto(pal.join(" "), maxChars) : ""];
  };

  if (!lista.length) return <Vacio texto="Aún no hay cursos con inscripciones" />;

  return (
    <div className="relative w-full">
    <div ref={ref} className="w-full overflow-x-auto" onScroll={(e) => setScroll(e.currentTarget.scrollLeft)}>
      {W > 0 && (
        <svg width={ancho} height={H} role="img" aria-label="Estudiantes inscritos por curso">
          {marcas.map((t) => (
            <g key={t}>
              <line x1={m.l} x2={ancho - m.r} y1={y(t)} y2={y(t)} stroke="var(--rx-grid)" strokeDasharray={t ? "3 4" : undefined} />
              <text x={m.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-(--rx-ink-3) text-[10px] tabular-nums">{num(t)}</text>
            </g>
          ))}
          {lista.map((c, i) => {
            const cx = m.l + banda * i + banda / 2;
            const h = Math.max(c.enrollments > 0 ? 4 : 0, m.t + ih - y(c.enrollments));
            const activo = hover === i;
            const r = Math.min(4, bw / 2, h);
            const top = m.t + ih - h;
            // Barra con esquinas redondeadas solo arriba (el extremo del dato)
            const d = h > 0
              ? `M${cx - bw / 2},${m.t + ih}V${top + r}Q${cx - bw / 2},${top} ${cx - bw / 2 + r},${top}H${cx + bw / 2 - r}Q${cx + bw / 2},${top} ${cx + bw / 2},${top + r}V${m.t + ih}Z`
              : "";
            return (
              <g key={c.id} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className="cursor-default">
                <rect x={cx - banda / 2} y={m.t} width={banda} height={ih} fill={activo ? "var(--rx-accent-2)" : "transparent"} rx={8} />
                <path d={d} fill="var(--rx-accent)" opacity={hover === null || activo ? 1 : 0.45} className="transition-opacity duration-200"
                  style={{ transformOrigin: `${cx}px ${m.t + ih}px`, animation: `rx-grow .7s ${i * 60}ms cubic-bezier(.2,.7,.2,1) both` }} />
                <text x={cx} y={top - 7} textAnchor="middle" className="fill-(--rx-ink) text-[12px] font-semibold tabular-nums">{num(c.enrollments)}</text>
                {lineas(c.title).map((l, k) => l && (
                  <text key={k} x={cx} y={m.t + ih + 17 + k * 13} textAnchor="middle" className="fill-(--rx-ink-2) text-[11px]">{l}</text>
                ))}
                {c.category && (
                  <text x={cx} y={m.t + ih + 46} textAnchor="middle" className="fill-(--rx-ink-3) text-[10px]">{corto(c.category, maxChars)}</text>
                )}
              </g>
            );
          })}
          <style>{`@keyframes rx-grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}`}</style>
        </svg>
      )}
    </div>
      {hover !== null && lista[hover] && (
        <Tooltip x={m.l + banda * hover + banda / 2 - scroll} y={y(lista[hover].enrollments) - 18} ancho={W}>
          <p className="font-semibold">{lista[hover].title}</p>
          <div className="mt-1 grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 text-(--rx-ink-2)">
            <span>Inscritos</span><span className="text-right font-semibold text-(--rx-ink)">{num(lista[hover].enrollments)}</span>
            <span>Certificados</span><span className="text-right font-semibold text-(--rx-ink)">{num(lista[hover].completions)}</span>
            <span>Avance promedio</span><span className="text-right font-semibold text-(--rx-ink)">{lista[hover].avgProgress}%</span>
            <span>Nuevos en el periodo</span><span className="text-right font-semibold text-(--rx-ink)">+{num(lista[hover].newEnrollments)}</span>
          </div>
        </Tooltip>
      )}
    </div>
  );
}

/* ═════════════════════════════ Dona de estados ═════════════════════════════ */

const ESTADOS = [
  { k: "completado", l: "Completado", c: "var(--rx-done)", d: "Terminaron el curso" },
  { k: "en_progreso", l: "En progreso", c: "var(--rx-prog)", d: "Avanzan lección a lección" },
  { k: "sin_iniciar", l: "Sin iniciar", c: "var(--rx-idle)", d: "Inscritos sin avance aún" },
] as const;

function Dona({ estado }: { estado: Analytics["status"] }) {
  const [hover, setHover] = useState<number | null>(null);
  const valores = ESTADOS.map((e) => estado[e.k]);
  const total = valores.reduce((a, b) => a + b, 0);
  const totalAnim = useContador(total);
  const S = 180, R = 80, r = 55, cx = S / 2, cy = S / 2;

  const clave = valores.join(",");
  const arcos = (() => {
    const vals = clave.split(",").map(Number);
    const conValor = vals.filter((v) => v > 0).length;
    const hueco = conValor > 1 ? 0.025 : 0; // separación entre segmentos
    const angulo = (v: number) => (total ? (v / total) * Math.PI * 2 : 0);
    return vals.map((v, i) => {
      const a0 = -Math.PI / 2 + vals.slice(0, i).reduce((s, x) => s + angulo(x), 0);
      const ang = angulo(v);
      const ini = a0 + (v ? hueco / 2 : 0), fin = a0 + ang - (v ? hueco / 2 : 0);
      if (v === 0) return "";
      if (ang >= Math.PI * 2 - 1e-6) {
        // Un solo estado: anillo completo
        return `M${cx},${cy - R}A${R},${R} 0 1 1 ${cx - 0.01},${cy - R}ZM${cx},${cy - r}A${r},${r} 0 1 0 ${cx + 0.01},${cy - r}Z`;
      }
      const grande = fin - ini > Math.PI ? 1 : 0;
      const p = (rad: number, a: number) => `${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`;
      return `M${p(R, ini)}A${R},${R} 0 ${grande} 1 ${p(R, fin)}L${p(r, fin)}A${r},${r} 0 ${grande} 0 ${p(r, ini)}Z`;
    });
  })();

  if (!total) return <Vacio texto="Todavía no hay inscripciones" />;
  const sel = hover !== null ? hover : null;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="relative shrink-0">
        <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} role="img" aria-label="Estado de inscripciones">
          {arcos.map((d, i) => d && (
            <path key={i} d={d} fill={ESTADOS[i].c} fillRule="evenodd"
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
              style={{ transformOrigin: "center", transform: sel === i ? "scale(1.05)" : "scale(1)", transition: "transform .25s, opacity .25s" }}
              opacity={sel === null || sel === i ? 1 : 0.4} />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {sel === null ? (
            <>
              <span className="text-3xl font-bold tabular-nums text-(--rx-ink)">{num(totalAnim)}</span>
              <span className="text-[11px] text-(--rx-ink-3)">inscripciones</span>
            </>
          ) : (
            <>
              <span className="text-3xl font-bold tabular-nums text-(--rx-ink)">{Math.round((valores[sel] / total) * 100)}%</span>
              <span className="text-[11px] text-(--rx-ink-3)">{ESTADOS[sel].l}</span>
            </>
          )}
        </div>
      </div>
      <ul className="w-full space-y-2.5">
        {ESTADOS.map((e, i) => {
          const pct = total ? Math.round((valores[i] / total) * 100) : 0;
          return (
            <li key={e.k} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
              className={`rounded-xl border px-3 py-2 transition-colors ${sel === i ? "border-(--rx-border) bg-(--rx-surface-2)" : "border-transparent"}`}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 whitespace-nowrap text-(--rx-ink)">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: e.c }} />
                  {e.l}
                </span>
                <span className="whitespace-nowrap tabular-nums text-(--rx-ink)"><b>{pct}%</b> <span className="text-xs text-(--rx-ink-3)">({num(valores[i])})</span></span>
              </div>
              <p className="ml-[18px] text-[11px] text-(--rx-ink-3)">{e.d}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ═════════════════════════════ Mapa de calor ═════════════════════════════ */

function MapaCalor({ datos }: { datos: number[][] }) {
  const [hover, setHover] = useState<{ d: number; h: number } | null>(null);
  const max = Math.max(...datos.flat(), 0);
  // 5 niveles de un solo tono (cian): más oscuro/intenso = más actividad
  const nivel = (v: number) => (v === 0 || max === 0 ? 0 : Math.min(5, Math.ceil((v / max) * 5)));
  const fondo = (n: number) =>
    n === 0 ? "var(--rx-cell)" : `color-mix(in srgb, var(--rx-accent) ${[0, 22, 40, 58, 78, 100][n]}%, var(--rx-cell))`;

  if (max === 0) return <Vacio texto="Sin lecciones completadas en este periodo" />;

  return (
    <div className="relative">
      <div className="-mt-10 overflow-x-auto pb-1 pt-10">
        <div className="min-w-[560px]">
          <div className="grid grid-cols-[34px_repeat(24,minmax(0,1fr))] gap-[3px]">
            <span />
            {Array.from({ length: 24 }, (_, h) => (
              <span key={h} className="text-center text-[9px] text-(--rx-ink-3)">{h % 3 === 0 ? h : ""}</span>
            ))}
            {datos.map((fila, d) => (
              <div key={d} className="contents">
                <span className="pr-1 text-right text-[10px] leading-[18px] text-(--rx-ink-3)">{DIAS[d]}</span>
                {fila.map((v, h) => (
                  <div key={h}
                    onMouseEnter={() => setHover({ d, h })} onMouseLeave={() => setHover(null)}
                    className="relative h-[18px] rounded-[4px] transition-transform duration-150 hover:z-10 hover:scale-125"
                    style={{ background: fondo(nivel(v)), outline: hover?.d === d && hover?.h === h ? "2px solid var(--rx-ink)" : "none" }}>
                    {hover?.d === d && hover?.h === h && (
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-(--rx-border) bg-(--rx-tip) px-3 py-1.5 text-xs text-(--rx-ink) shadow-xl">
                        <b>{DIAS[d]} {hora(h)}</b> · {num(v)} {v === 1 ? "lección" : "lecciones"}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-(--rx-ink-3)">
        Menos
        {[0, 1, 2, 3, 4, 5].map((n) => <span key={n} className="h-3 w-3 rounded-[3px]" style={{ background: fondo(n) }} />)}
        Más
      </div>
    </div>
  );
}

/* ═════════════════════════════ Embudo de aprendizaje ═════════════════════════════ */

function Embudo({ pasos }: { pasos: Analytics["funnel"] }) {
  const [ref, W] = useAncho<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const H = 190;
  const base = Math.max(pasos[0]?.value ?? 0, 1);
  const n = pasos.length;
  const col = W / Math.max(n, 1);
  const bw = Math.min(96, col * 0.42);
  const alto = (v: number) => Math.max(v > 0 ? 6 : 2, (v / base) * (H - 20));
  const cy = H / 2;

  return (
    <div>
      <div ref={ref} className="relative w-full">
        {W > 0 && (
          <svg width={W} height={H} role="img" aria-label="Embudo de aprendizaje">
            <defs>
              <linearGradient id="rx-flujo" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--rx-accent)" stopOpacity="0.28" />
                <stop offset="100%" stopColor="var(--rx-accent)" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            {pasos.map((p, i) => {
              if (i === n - 1) return null;
              const x1 = col * i + col / 2 + bw / 2, x2 = col * (i + 1) + col / 2 - bw / 2;
              const h1 = alto(p.value) / 2, h2 = alto(pasos[i + 1].value) / 2;
              return <path key={`f${i}`} d={`M${x1},${cy - h1}C${(x1 + x2) / 2},${cy - h1} ${(x1 + x2) / 2},${cy - h2} ${x2},${cy - h2}L${x2},${cy + h2}C${(x1 + x2) / 2},${cy + h2} ${(x1 + x2) / 2},${cy + h1} ${x1},${cy + h1}Z`} fill="url(#rx-flujo)" />;
            })}
            {pasos.map((p, i) => {
              const h = alto(p.value), x = col * i + col / 2 - bw / 2;
              return (
                <g key={p.key} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                  <rect x={x} y={cy - h / 2} width={bw} height={h} rx={6} fill="var(--rx-accent)"
                    opacity={hover === null || hover === i ? 1 - i * 0.1 : 0.35} className="transition-opacity" />
                  <rect x={col * i} y={0} width={col} height={H} fill="transparent" />
                </g>
              );
            })}
          </svg>
        )}
        {hover !== null && pasos[hover] && (
          <Tooltip x={col * hover + col / 2} y={cy - alto(pasos[hover].value) / 2} ancho={W}>
            <p className="font-semibold">{pasos[hover].label}</p>
            <p className="text-(--rx-ink-2)">{num(pasos[hover].value)} alumnos · {Math.round((pasos[hover].value / base) * 100)}% del total</p>
          </Tooltip>
        )}
      </div>
      <div className="grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0,1fr))` }}>
        {pasos.map((p, i) => {
          const conv = i > 0 && pasos[i - 1].value > 0 ? Math.round((p.value / pasos[i - 1].value) * 100) : null;
          return (
            <div key={p.key} className="px-1 text-center">
              <p className="text-lg font-bold tabular-nums text-(--rx-ink)">{num(p.value)}</p>
              <p className="text-[11px] leading-tight text-(--rx-ink-2)">{p.label}</p>
              <p className="mt-1 text-[10px] text-(--rx-ink-3)">
                {i === 0 ? "100%" : conv === null ? "—" : <><span className="font-semibold text-(--rx-ink-2)">{conv}%</span> del paso anterior</>}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═════════════════════════════ Insights automáticos ═════════════════════════════ */

function calcularInsights(a: Analytics) {
  const out: { icono: string; titulo: string; texto: string }[] = [];
  const ins = delta(a.kpis.enrollments);
  if (a.kpis.enrollments.actual || a.kpis.enrollments.anterior) {
    out.push({
      icono: ins.dir >= 0 ? "📈" : "📉",
      titulo: ins.pct === null ? "Primeras inscripciones" : ins.dir >= 0 ? `Inscripciones +${ins.pct}%` : `Inscripciones ${ins.pct}%`,
      texto: `${num(a.kpis.enrollments.actual)} en este periodo frente a ${num(a.kpis.enrollments.anterior)} en el anterior.`,
    });
  }
  const top = a.courses.find((c) => c.newEnrollments > 0) ?? a.courses[0];
  if (top && top.enrollments > 0) {
    const masNuevo = [...a.courses].sort((x, y) => y.newEnrollments - x.newEnrollments)[0];
    out.push({
      icono: "🏆",
      titulo: "Curso estrella",
      texto: masNuevo.newEnrollments > 0
        ? `"${masNuevo.title}" sumó ${num(masNuevo.newEnrollments)} inscripciones nuevas.`
        : `"${top.title}" lidera con ${num(top.enrollments)} inscritos.`,
    });
  }
  let mejor = { d: 0, h: 0, v: 0 };
  a.heatmap.forEach((f, d) => f.forEach((v, h) => { if (v > mejor.v) mejor = { d, h, v }; }));
  if (mejor.v > 0) {
    const porDia = a.heatmap.map((f) => f.reduce((s, v) => s + v, 0));
    const dTop = porDia.indexOf(Math.max(...porDia));
    out.push({
      icono: "⏰",
      titulo: `Hora pico: ${hora(mejor.h)}`,
      texto: `Los alumnos estudian más los ${DIAS_LARGO[dTop]}. Buen momento para publicar contenido o avisos.`,
    });
  }
  let caida = { i: -1, pct: 0 };
  a.funnel.forEach((p, i) => {
    if (i < 2 || !a.funnel[i - 1].value) return; // desde "empezaron" en adelante
    const perdida = 100 - Math.round((p.value / a.funnel[i - 1].value) * 100);
    if (perdida > caida.pct) caida = { i, pct: perdida };
  });
  if (caida.i > 0 && caida.pct > 0) {
    out.push({
      icono: "🎯",
      titulo: "Oportunidad de mejora",
      texto: `El ${caida.pct}% no pasa de "${a.funnel[caida.i - 1].label.toLowerCase()}" a "${a.funnel[caida.i].label.toLowerCase()}".`,
    });
  }
  const sinIniciar = a.status.sin_iniciar;
  if (sinIniciar > 0 && out.length < 4) {
    out.push({ icono: "💡", titulo: `${num(sinIniciar)} sin empezar`, texto: "Un recordatorio por correo o WhatsApp puede activar a estos alumnos." });
  }
  return out.slice(0, 4);
}

/* ═════════════════════════════ Página ═════════════════════════════ */

type Orden = "enrollments" | "completions" | "avgProgress" | "title";

export default function AdminReportsPage() {
  const { getAnalytics } = useAdminApi();
  const [dias, setDias] = useState(30);
  const [data, setData] = useState<Analytics | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [metrica, setMetrica] = useState<Metrica>("enrollments");
  const [todos, setTodos] = useState(false);
  const [buscar, setBuscar] = useState("");
  const [orden, setOrden] = useState<{ k: Orden; asc: boolean }>({ k: "enrollments", asc: false });

  const cargar = useCallback(async (d: number) => {
    setCargando(true); setError("");
    try {
      setData(await getAnalytics(d));
    } catch (e: any) {
      setError(e?.response?.status === 404
        ? "El servidor aún no tiene la ruta /admin/analytics. Actualiza el backend y reinícialo."
        : "No se pudieron cargar las métricas. Intenta nuevamente.");
    } finally {
      setCargando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { cargar(dias); }, [dias, cargar]);

  const insights = useMemo(() => (data ? calcularInsights(data) : []), [data]);

  const filas = useMemo(() => {
    if (!data) return [];
    const q = buscar.trim().toLowerCase();
    const f = data.courses.filter((c) => !q || c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
    return [...f].sort((a, b) => {
      const va = a[orden.k], vb = b[orden.k];
      const r = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number);
      return orden.asc ? r : -r;
    });
  }, [data, buscar, orden]);

  const exportarCSV = () => {
    if (!data) return;
    const enc = ["Curso", "Categoría", "Estado", "Lecciones", "Inscritos", "Nuevos en periodo", "En progreso", "Certificados", "Avance promedio %", "Tasa de finalización %"];
    const lineas = data.courses.map((c) => [
      c.title, c.category, c.status === "published" ? "Publicado" : "Borrador", c.lessons, c.enrollments, c.newEnrollments,
      c.inProgress, c.completions, c.avgProgress, c.enrollments ? Math.round((c.completions / c.enrollments) * 100) : 0,
    ]);
    const csv = [enc, ...lineas].map((f) => f.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = `reporte-cursos-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const serie = (k: Metrica) => data?.timeline.map((t) => t[k]) ?? [];
  const actualizado = data ? new Date(data.generatedAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : "";
  const periodoTxt = RANGOS.find((r) => r.d === dias)?.l ?? "";

  const ordenar = (k: Orden) => setOrden((o) => ({ k, asc: o.k === k ? !o.asc : k === "title" }));
  const th = (k: Orden, children: React.ReactNode, className = "") => (
    <th key={k} className={`px-4 py-3 font-medium ${className}`}>
      <button onClick={() => ordenar(k)} className="inline-flex items-center gap-1 hover:text-(--rx-ink)">
        {children}
        <span className={`text-[9px] ${orden.k === k ? "text-(--rx-accent)" : "opacity-30"}`}>{orden.k === k && orden.asc ? "▲" : "▼"}</span>
      </button>
    </th>
  );

  return (
    <div className="rx keep-theme space-y-5 p-4 sm:p-6">
      {/* ── Encabezado ─────────────────────────────────────────────── */}
      <div className="rx-in flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-brand text-2xl uppercase tracking-wide text-(--rx-accent)">Reportes y Métricas</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-(--rx-ink-3)">
            Análisis de inscripciones, progreso y actividad de la plataforma
            {data && !cargando && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-(--rx-border) px-2 py-0.5 text-[11px] text-(--rx-ink-2)">
                <span className="rx-live h-1.5 w-1.5 rounded-full bg-(--rx-up)" /> Actualizado {actualizado}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-(--rx-border) bg-(--rx-surface) p-1" role="tablist" aria-label="Periodo">
            {RANGOS.map((r) => (
              <button key={r.d} role="tab" aria-selected={dias === r.d} onClick={() => setDias(r.d)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${dias === r.d ? "bg-(--rx-accent) text-[#0d0d0d] shadow" : "text-(--rx-ink-2) hover:text-(--rx-ink)"}`}>
                {r.l}
              </button>
            ))}
          </div>
          <button onClick={() => cargar(dias)} title="Actualizar"
            className="grid h-9 w-9 place-items-center rounded-xl border border-(--rx-border) bg-(--rx-surface) text-(--rx-ink-2) transition-colors hover:text-(--rx-accent)">
            <svg className={`h-4 w-4 ${cargando ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
          <button onClick={exportarCSV} disabled={!data}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-(--rx-border) bg-(--rx-surface) px-3 text-xs font-semibold text-(--rx-ink) transition-colors hover:border-(--rx-accent) hover:text-(--rx-accent) disabled:opacity-40">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>
            Exportar CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="rx-card flex flex-col items-center gap-3 p-8 text-center">
          <p className="text-sm text-(--rx-ink)">{error}</p>
          <button onClick={() => cargar(dias)} className="rounded-lg bg-(--rx-accent) px-4 py-2 text-xs font-semibold text-[#0d0d0d]">Reintentar</button>
        </div>
      )}

      {!data && cargando && !error && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="rx-skel h-[126px]" />)}</div>
          <div className="grid gap-5 lg:grid-cols-3"><div className="rx-skel h-[340px] lg:col-span-2" /><div className="rx-skel h-[340px]" /></div>
          <div className="grid gap-5 lg:grid-cols-5"><div className="rx-skel h-[360px] lg:col-span-3" /><div className="rx-skel h-[360px] lg:col-span-2" /></div>
        </div>
      )}

      {data && (
        <div className={`space-y-5 transition-opacity duration-300 ${cargando ? "opacity-60" : ""}`}>
          {/* ── KPIs ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi titulo="Inscripciones" periodo={data.kpis.enrollments} serie={serie("enrollments")} delay={0}
              icono={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>} />
            <Kpi titulo="Lecciones completadas" periodo={data.kpis.lessons} serie={serie("lessons")} delay={60}
              icono={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
            <Kpi titulo="Nuevos alumnos" periodo={data.kpis.students} serie={serie("students")} delay={120}
              icono={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>} />
            <Kpi titulo="Alumnos activos" periodo={data.kpis.activeStudents} serie={serie("lessons")} delay={180}
              icono={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} />
          </div>

          {/* ── Insights ─────────────────────────────────────────── */}
          {insights.length > 0 && (
            <div className="rx-in grid gap-3 sm:grid-cols-2 xl:grid-cols-4" style={{ animationDelay: "200ms" }}>
              {insights.map((it, i) => (
                <div key={i} className="flex gap-3 rounded-2xl border border-dashed border-(--rx-border) bg-(--rx-surface-2) p-3.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-(--rx-surface) text-lg" aria-hidden>{it.icono}</span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-(--rx-ink)">{it.titulo}</p>
                    <p className="mt-0.5 text-xs leading-snug text-(--rx-ink-2)">{it.texto}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Tendencia + salud ────────────────────────────────── */}
          <div className="grid gap-5 lg:grid-cols-3">
            <Tarjeta className="lg:col-span-2" delay={240}
              titulo="Actividad en el tiempo"
              sub={`Últimos ${periodoTxt}${data.granularity === "week" ? " · por semana" : " · por día"}`}
              accion={
                <div className="flex flex-wrap gap-1 sm:justify-end">
                  {METRICAS.map((q) => (
                    <button key={q.k} onClick={() => setMetrica(q.k)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${metrica === q.k ? "bg-(--rx-accent-2) text-(--rx-accent)" : "text-(--rx-ink-3) hover:text-(--rx-ink)"}`}>
                      {q.l}
                    </button>
                  ))}
                </div>
              }>
              <GraficoArea datos={data.timeline} metrica={metrica} semanal={data.granularity === "week"} />
            </Tarjeta>

            <Tarjeta titulo="Salud de la plataforma" sub="Indicadores acumulados" delay={300}>
              <Medidor valor={data.kpis.completionRate} etiqueta="tasa de finalización" />
              <div className="mt-4 space-y-3">
                <div>
                  <div className="mb-1 flex justify-between text-xs"><span className="text-(--rx-ink-2)">Avance promedio por inscripción</span><b className="tabular-nums text-(--rx-ink)">{data.kpis.avgProgress}%</b></div>
                  <div className="h-2 overflow-hidden rounded-full bg-(--rx-cell)">
                    <div className="h-full rounded-full bg-(--rx-accent) transition-all duration-700" style={{ width: `${data.kpis.avgProgress}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-(--rx-surface-2) p-3">
                    <p className="text-xl font-bold tabular-nums text-(--rx-ink)">{num(data.kpis.totalStudents)}</p>
                    <p className="text-[11px] text-(--rx-ink-3)">Alumnos registrados</p>
                  </div>
                  <div className="rounded-xl bg-(--rx-surface-2) p-3">
                    <p className="text-xl font-bold tabular-nums text-(--rx-ink)">{num(data.kpis.totalEnrollments)}</p>
                    <p className="text-[11px] text-(--rx-ink-3)">Inscripciones totales</p>
                  </div>
                </div>
              </div>
            </Tarjeta>
          </div>

          {/* ── Estudiantes por curso + estado ───────────────────── */}
          <div className="grid gap-5 lg:grid-cols-5">
            <Tarjeta className="lg:col-span-3" delay={340}
              titulo="Estudiantes por curso" sub="Alumnos inscritos en cada curso (acumulado)"
              accion={data.courses.length > 6 && (
                <button onClick={() => setTodos((t) => !t)} className="text-xs font-semibold text-(--rx-accent) hover:underline">
                  {todos ? "Ver top 6" : `Ver todos (${data.courses.length})`}
                </button>
              )}>
              <Barras cursos={data.courses} todos={todos} />
            </Tarjeta>
            <Tarjeta className="lg:col-span-2" titulo="Estado de inscripciones" sub="Según el avance real de cada alumno" delay={400}>
              <Dona estado={data.status} />
            </Tarjeta>
          </div>

          {/* ── Embudo + mapa de calor ───────────────────────────── */}
          <div className="grid gap-5 lg:grid-cols-5">
            <Tarjeta className="lg:col-span-2" titulo="Embudo de aprendizaje" sub="Desde el registro hasta el certificado" delay={440}>
              <Embudo pasos={data.funnel} />
            </Tarjeta>
            <Tarjeta className="lg:col-span-3" titulo="¿Cuándo estudian?" sub={`Lecciones completadas por día y hora (hora de Lima) · ${periodoTxt}`} delay={480}>
              <MapaCalor datos={data.heatmap} />
            </Tarjeta>
          </div>

          {/* ── Ranking + tabla ──────────────────────────────────── */}
          <div className="grid gap-5 xl:grid-cols-3">
            <Tarjeta titulo="Alumnos más activos" sub={`Lecciones completadas · ${periodoTxt}`} delay={520}>
              {data.topStudents.length === 0 ? <Vacio texto="Sin actividad en este periodo" /> : (
                <ol className="space-y-2">
                  {data.topStudents.map((s, i) => {
                    const max = data.topStudents[0].lessons || 1;
                    const ini = s.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
                    return (
                      <li key={i} className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-(--rx-surface-2)">
                        <span className={`w-5 text-center text-xs font-bold ${i < 3 ? "text-(--rx-accent)" : "text-(--rx-ink-3)"}`}>{i + 1}</span>
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-(--rx-accent-2) text-xs font-bold text-(--rx-accent)">{ini}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="truncate text-sm font-medium text-(--rx-ink)">{s.name}</p>
                            <p className="shrink-0 text-xs tabular-nums text-(--rx-ink)"><b>{num(s.lessons)}</b> <span className="text-(--rx-ink-3)">lecc.</span></p>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-(--rx-cell)">
                            <div className="h-full rounded-full bg-(--rx-accent)" style={{ width: `${(s.lessons / max) * 100}%` }} />
                          </div>
                          <p className="mt-1 text-[10px] text-(--rx-ink-3)">{s.courses} {s.courses === 1 ? "curso" : "cursos"} · {s.certificates} {s.certificates === 1 ? "certificado" : "certificados"}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </Tarjeta>

            <Tarjeta className="xl:col-span-2" titulo="Detalle por curso" sub="Ordena por cualquier columna" delay={560}
              accion={
                <div className="relative">
                  <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar curso..."
                    className="w-44 rounded-lg border border-(--rx-border) bg-(--rx-surface-2) py-1.5 pl-8 pr-3 text-xs text-(--rx-ink) placeholder:text-(--rx-ink-3) focus:border-(--rx-accent) focus:outline-none" />
                  <svg className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-(--rx-ink-3)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
              }>
              <div className="-mx-5 -mb-5 overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-y border-(--rx-border) text-left text-xs text-(--rx-ink-3)">
                      {th("title", "Curso")}
                      {th("enrollments", "Inscritos", "text-right")}
                      {th("completions", "Certificados", "text-right")}
                      {th("avgProgress", "Avance promedio")}
                      <th className="px-4 py-3 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map((c) => (
                      <tr key={c.id} className="border-b border-(--rx-grid) transition-colors last:border-0 hover:bg-(--rx-surface-2)">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {c.image
                              ? <img src={c.image} alt="" className="h-9 w-14 shrink-0 rounded-md object-cover" />
                              : <span className="h-9 w-14 shrink-0 rounded-md bg-(--rx-cell)" />}
                            <div className="min-w-0">
                              <p className="truncate font-medium text-(--rx-ink)">{c.title}</p>
                              <p className="text-[11px] text-(--rx-ink-3)">{c.category || "Sin categoría"} · {c.lessons} lecciones</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-(--rx-ink)">
                          {num(c.enrollments)}
                          {c.newEnrollments > 0 && <span className="ml-1.5 text-[10px] font-semibold text-(--rx-up)">+{c.newEnrollments}</span>}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-(--rx-ink)">{num(c.completions)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-(--rx-cell)">
                              <div className="h-full rounded-full bg-(--rx-accent)" style={{ width: `${c.avgProgress}%` }} />
                            </div>
                            <span className="w-9 text-xs tabular-nums text-(--rx-ink-2)">{c.avgProgress}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${c.status === "published" ? "bg-(--rx-accent-2) text-(--rx-accent)" : "bg-(--rx-cell) text-(--rx-ink-2)"}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${c.status === "published" ? "bg-(--rx-accent)" : "bg-(--rx-ink-3)"}`} />
                            {c.status === "published" ? "Publicado" : "Borrador"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filas.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-10 text-center text-xs text-(--rx-ink-3)">No hay cursos que coincidan.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Tarjeta>
          </div>
        </div>
      )}
    </div>
  );
}
