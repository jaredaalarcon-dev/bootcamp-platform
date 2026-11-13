// src/components/ui/CourseResourcesPanel.tsx
// Pestaña "Recursos" del curso (vista del alumno).
// Arriba: la "biblioteca" con una carpeta de vidrio por tipo de recurso
// (guías, ejercicios, lecturas…). Se abre con un clic y cada archivo se
// descarga al tocarlo. Abajo: la lista completa, con filtros.
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import GlassFolder, { ArtPreset, FolderFile } from "@/components/ui/glass-folder-cards";
import { useResourcesApi, CourseResource, TipoRecurso } from "@/hooks/useResourcesApi";
import { ResourceIcon, etiquetaTipo, claseTipo, tamano, extension } from "@/components/ui/ResourceIcon";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  courseId: string;
  enrolled: boolean;
}

// Nombre de cada carpeta y la obra de su panel trasero (colores de la marca)
const CARPETAS: Record<TipoRecurso, { titulo: string; arte: ArtPreset }> = {
  guia:      { titulo: "Guías",          arte: "sijb" },
  lectura:   { titulo: "Bibliografía",   arte: "sijbHielo" },
  ejercicio: { titulo: "Ejercicios",     arte: "sijbRojo" },
  plantilla: { titulo: "Plantillas",     arte: "sijbHielo" },
  enlace:    { titulo: "Enlaces",        arte: "sijb" },
  otro:      { titulo: "Más material",   arte: "sijbRojo" },
};
const ORDEN: TipoRecurso[] = ["guia", "lectura", "ejercicio", "plantilla", "enlace", "otro"];

const metaArchivo = (r: CourseResource) =>
  r.isFile ? [extension(r), tamano(r.fileSize)].filter(Boolean).join(" · ") : "Enlace web";

/** Fondo de "escritorio" punteado sobre el que descansan las carpetas. */
function Escritorio({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`card-dark relative overflow-hidden ${className}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 text-gray-500 opacity-[0.16]"
        style={{ backgroundImage: "radial-gradient(currentColor 1.1px, transparent 1.4px)", backgroundSize: "22px 22px" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[70%] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(closest-side, #00C0E7, transparent)" }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

export function CourseResourcesPanel({ courseId, enrolled }: Props) {
  const { getByCourse, download } = useResourcesApi();
  const { esClaro } = useTheme();
  const [recursos, setRecursos] = useState<CourseResource[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<TipoRecurso | "todos">("todos");
  const [abriendo, setAbriendo] = useState<string | null>(null);
  const [ancho, setAncho] = useState(300);
  const listaRef = useRef<HTMLDivElement>(null);
  const tono = esClaro ? "light" : "dark";

  // Carpetas un poco más chicas en celular
  useEffect(() => {
    const medir = () => setAncho(window.innerWidth < 640 ? Math.min(300, window.innerWidth - 72) : 300);
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);

  useEffect(() => {
    if (!enrolled) { setCargando(false); return; }
    setCargando(true);
    getByCourse(courseId).then((r) => {
      setRecursos(r.data);
      setCargando(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, enrolled]);

  const grupos = useMemo(
    () =>
      ORDEN.map((t) => ({ tipo: t, items: recursos.filter((r) => r.type === t) })).filter((g) => g.items.length > 0),
    [recursos],
  );
  const tipos = grupos.map((g) => g.tipo);
  const visibles = filtro === "todos" ? recursos : recursos.filter((r) => r.type === filtro);
  const pesoTotal = recursos.reduce((s, r) => s + (r.fileSize ?? 0), 0);

  const abrir = async (r: CourseResource) => {
    setAbriendo(r.id);
    const res = await download(r.id);
    setAbriendo(null);
    if (!res.success) toast.error(res.error || "No se pudo abrir el recurso");
  };

  const verEnLista = (t: TipoRecurso) => {
    setFiltro(t);
    listaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ── Sin inscripción: carpeta sellada ─────────────────────────────────────
  if (!enrolled) {
    return (
      <Escritorio className="px-6 py-10">
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-center md:gap-12 md:text-left">
          <GlassFolder
            label="Biblioteca"
            meta="Solo alumnos inscritos"
            tone={tono}
            art="sijb"
            seed={7}
            files={[]}
            action="none"
            width={Math.min(ancho, 260)}
          />
          <div className="max-w-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(227,30,36,0.12)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#E31E24]">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Contenido exclusivo
            </span>
            <p className="mt-3 text-lg font-semibold text-white">Recursos exclusivos para alumnos inscritos</p>
            <p className="mt-1 text-sm text-gray-500">Inscríbete en el curso para descargar la guía, la bibliografía, los ejercicios y todo el material de apoyo.</p>
          </div>
        </div>
      </Escritorio>
    );
  }

  if (cargando) {
    return <div className="card-dark p-12 flex justify-center"><div className="spinner-cyan" /></div>;
  }

  // ── Vacío: carpeta esperando material ────────────────────────────────────
  if (recursos.length === 0) {
    return (
      <Escritorio className="px-6 py-10">
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-center md:gap-12 md:text-left">
          <GlassFolder
            label="Biblioteca"
            meta="Muy pronto"
            tone={tono}
            art="sijbHielo"
            seed={5}
            files={[]}
            action="none"
            width={Math.min(ancho, 260)}
          />
          <div className="max-w-sm">
            <p className="font-brand text-sm uppercase tracking-wide text-[#00C0E7]">Biblioteca del curso</p>
            <p className="mt-2 text-lg font-semibold text-white">Aún no hay recursos para este curso.</p>
            <p className="mt-1 text-sm text-gray-500">Pronto encontrarás aquí la guía del curso, bibliografía, ejercicios y material de apoyo.</p>
          </div>
        </div>
      </Escritorio>
    );
  }

  // ── Biblioteca ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <Escritorio className="px-4 pb-8 pt-6 sm:px-8">
        <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-brand text-lg uppercase tracking-wide text-[#00C0E7]">Biblioteca del curso</p>
            <p className="text-xs text-gray-500">
              {recursos.length} {recursos.length === 1 ? "recurso" : "recursos"} en {grupos.length} {grupos.length === 1 ? "carpeta" : "carpetas"}
              {pesoTotal > 0 && <> · {tamano(pesoTotal)} en total</>}
            </p>
          </div>
          <p className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500 sm:block">
            Pasa el cursor · Clic para abrir · Toca un archivo para descargarlo
          </p>
        </div>

        <div className="grid grid-cols-1 items-end justify-items-center gap-x-10 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
          {grupos.map((g, i) => {
            const conf = CARPETAS[g.tipo];
            const files: FolderFile[] = g.items.map((r) => ({ name: r.title, meta: metaArchivo(r) }));
            return (
              <GlassFolder
                key={`${g.tipo}-${g.items.map((r) => r.id).join(".")}-${tono}`}
                label={conf.titulo}
                meta={`${g.items.length} ${g.items.length === 1 ? "archivo" : "archivos"}`}
                tone={i % 3 === 1 ? (tono === "dark" ? "light" : "dark") : tono}
                art={conf.arte}
                seed={3 + i * 4}
                files={files}
                action="more"
                labelPlacement={i % 3 === 2 ? "top-right" : "bottom-left"}
                menu={[
                  { label: "Ver en la lista", onSelect: () => verEnLista(g.tipo) },
                  ...(g.items.length > 4 ? [{ label: `Ver los ${g.items.length} archivos`, onSelect: () => verEnLista(g.tipo) }] : []),
                ]}
                onFileSelect={(_, idx) => {
                  // La carpeta muestra los 4 últimos: el índice es sobre la lista completa
                  const r = g.items[idx];
                  if (r) abrir(r);
                }}
                width={ancho}
                appearDelay={i * 120}
              />
            );
          })}
        </div>
      </Escritorio>

      {/* ── Lista completa ─────────────────────────────────────────────── */}
      <div ref={listaRef} className="scroll-mt-24 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-gray-400 text-sm">
            <span className="font-brand text-[#00C0E7] text-lg">{visibles.length}</span>{" "}
            {filtro === "todos" ? (recursos.length === 1 ? "recurso disponible" : "recursos disponibles") : `en ${CARPETAS[filtro].titulo}`}
          </p>
          {tipos.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {(["todos", ...tipos] as (TipoRecurso | "todos")[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setFiltro(t)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                    filtro === t
                      ? "bg-[#00C0E7] text-[#0d0d0d]"
                      : "border border-[rgba(0,192,231,0.3)] text-gray-400 hover:border-[#00C0E7] hover:text-[#00C0E7]"
                  }`}
                >
                  {t === "todos" ? "Todos" : CARPETAS[t].titulo}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {visibles.map((r) => (
            <div key={r.id} className="card-dark p-4 flex items-start gap-4 hover:border-[#00C0E7]/50 transition-colors">
              <ResourceIcon resource={r} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${claseTipo(r.type)}`}>
                    {etiquetaTipo(r.type)}
                  </span>
                  {r.isFile && r.fileSize ? <span className="text-gray-500 text-[11px]">{tamano(r.fileSize)}</span> : null}
                </div>
                <h4 className="text-white font-semibold text-sm mt-1.5 line-clamp-2">{r.title}</h4>
                {r.description && <p className="text-gray-500 text-xs mt-1 line-clamp-3">{r.description}</p>}
                <button
                  onClick={() => abrir(r)}
                  disabled={abriendo === r.id}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#E31E24] hover:brightness-125 disabled:opacity-50 transition"
                >
                  {r.isFile ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  )}
                  {abriendo === r.id ? "Abriendo…" : r.isFile ? "Descargar" : "Abrir enlace"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
