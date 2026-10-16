// src/components/ui/CourseResourcesPanel.tsx
// Pestaña "Recursos" del curso (vista del alumno): guías, ejercicios y material de apoyo.
"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useResourcesApi, CourseResource, TipoRecurso } from "@/hooks/useResourcesApi";
import { ResourceIcon, etiquetaTipo, claseTipo, tamano } from "@/components/ui/ResourceIcon";

interface Props {
  courseId: string;
  enrolled: boolean;
}

export function CourseResourcesPanel({ courseId, enrolled }: Props) {
  const { getByCourse, download } = useResourcesApi();
  const [recursos, setRecursos] = useState<CourseResource[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<TipoRecurso | "todos">("todos");
  const [abriendo, setAbriendo] = useState<string | null>(null);

  useEffect(() => {
    if (!enrolled) { setCargando(false); return; }
    setCargando(true);
    getByCourse(courseId).then((r) => {
      setRecursos(r.data);
      setCargando(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, enrolled]);

  const tipos = useMemo(
    () => Array.from(new Set(recursos.map((r) => r.type))),
    [recursos],
  );
  const visibles = filtro === "todos" ? recursos : recursos.filter((r) => r.type === filtro);

  const abrir = async (r: CourseResource) => {
    setAbriendo(r.id);
    const res = await download(r.id);
    setAbriendo(null);
    if (!res.success) toast.error(res.error || "No se pudo abrir el recurso");
  };

  // ── Sin inscripción ──────────────────────────────────────────────────────
  if (!enrolled) {
    return (
      <div className="card-dark p-10 text-center">
        <svg className="w-12 h-12 text-gray-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-white font-semibold">Recursos exclusivos para alumnos inscritos</p>
        <p className="text-gray-500 text-sm mt-1">Inscríbete en el curso para descargar guías, ejercicios y material de apoyo.</p>
      </div>
    );
  }

  if (cargando) {
    return <div className="card-dark p-12 flex justify-center"><div className="spinner-cyan" /></div>;
  }

  // ── Vacío ────────────────────────────────────────────────────────────────
  if (recursos.length === 0) {
    return (
      <div className="card-dark p-10 text-center">
        <svg className="w-12 h-12 text-gray-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-400 text-sm">Aún no hay recursos para este curso.</p>
        <p className="text-gray-500 text-xs mt-1">Pronto encontrarás guías, ejercicios y material de apoyo aquí.</p>
      </div>
    );
  }

  // ── Lista ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-gray-400 text-sm">
          <span className="font-brand text-[#00C0E7] text-lg">{recursos.length}</span>{" "}
          {recursos.length === 1 ? "recurso disponible" : "recursos disponibles"}
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
                {t === "todos" ? "Todos" : etiquetaTipo(t)}
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
  );
}
