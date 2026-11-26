// src/app/admin/community/page.tsx
// Preguntas de los alumnos por lección (responder) y reseñas de cursos (moderar).
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Stars } from "@/components/ui/Stars";
import { EVENTO_PREGUNTAS } from "@/components/admin/AdminLayout";
import {
  PreguntaAdmin, Resena, haceCuanto, mensajeError, questionsApi, reviewsApi,
} from "@/hooks/useCommunityApi";

type Vista = "preguntas" | "resenas";
type Estado = "pendientes" | "respondidas" | "todas";

const card = "bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-xl";

// ── Preguntas ───────────────────────────────────────────────────────────────
function Preguntas() {
  const [estado, setEstado] = useState<Estado>("pendientes");
  const [datos, setDatos] = useState<{ pendientes: number; items: PreguntaAdmin[] } | null>(null);
  const [curso, setCurso] = useState("");
  const [abierta, setAbierta] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargar = (e: Estado = estado) => {
    questionsApi.adminList(e).then(setDatos).catch(() => { setDatos({ pendientes: 0, items: [] }); toast.error("No se pudieron cargar las preguntas"); });
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargar(estado); }, [estado]);

  const cursos = useMemo(() => {
    const m = new Map<string, string>();
    datos?.items.forEach((q) => m.set(q.courseId, q.courseTitle));
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [datos]);
  const visibles = (datos?.items ?? []).filter((q) => !curso || q.courseId === curso);

  const abrir = (q: PreguntaAdmin) => {
    setAbierta(abierta === q.id ? null : q.id);
    setTexto(q.answer ?? "");
  };

  const responder = async (q: PreguntaAdmin) => {
    if (texto.trim().length < 2) { toast.error("Escribe la respuesta"); return; }
    setGuardando(true);
    try {
      await questionsApi.answer(q.id, texto.trim());
      toast.success(q.answer ? "Respuesta actualizada. Se avisó al alumno." : "Respuesta enviada. Se avisó al alumno.");
      setAbierta(null);
      setTexto("");
      window.dispatchEvent(new Event(EVENTO_PREGUNTAS));
      cargar();
    } catch (e) {
      toast.error(mensajeError(e, "No se pudo enviar la respuesta"));
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (q: PreguntaAdmin) => {
    if (!window.confirm("¿Eliminar esta pregunta? No se puede deshacer.")) return;
    try {
      await questionsApi.adminRemove(q.id);
      toast.success("Pregunta eliminada");
      window.dispatchEvent(new Event(EVENTO_PREGUNTAS));
      cargar();
    } catch (e) {
      toast.error(mensajeError(e, "No se pudo eliminar"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {([["pendientes", `Sin responder${datos ? ` (${datos.pendientes})` : ""}`], ["respondidas", "Respondidas"], ["todas", "Todas"]] as [Estado, string][]).map(([k, t]) => (
            <button key={k} onClick={() => { if (k !== estado) { setDatos(null); setEstado(k); } }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors ${
                estado === k ? "bg-[rgba(0,192,231,0.15)] border-[#00C0E7]/50 text-[#00C0E7]" : "border-gray-800 text-gray-400 hover:text-white"
              }`}>
              {t}
            </button>
          ))}
        </div>
        {cursos.length > 1 && (
          <select value={curso} onChange={(e) => setCurso(e.target.value)} aria-label="Filtrar por curso" className="input-dark text-sm sm:ml-auto sm:w-72">
            <option value="">Todos los cursos</option>
            {cursos.map(([id, t]) => <option key={id} value={id}>{t}</option>)}
          </select>
        )}
      </div>

      {datos === null ? (
        <div className="flex justify-center py-16"><div className="spinner-cyan" /></div>
      ) : visibles.length === 0 ? (
        <div className={`${card} p-10 text-center`}>
          <p className="text-white font-semibold">{estado === "pendientes" ? "¡Todo respondido!" : "No hay preguntas aquí"}</p>
          <p className="text-gray-500 text-sm mt-1">{estado === "pendientes" ? "Cuando un alumno pregunte en una lección, aparecerá aquí." : "Prueba con otro filtro."}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visibles.map((q) => (
            <li key={q.id} className={`${card} p-4 ${q.answer ? "" : "border-l-4 border-l-[#E31E24]"}`}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-[#00C0E7] font-semibold truncate">
                    {q.courseTitle} <span className="text-gray-600">›</span> {q.moduleTitle} <span className="text-gray-600">›</span> {q.lessonTitle}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="text-white font-semibold">{q.authorName}</span> · {haceCuanto(q.createdAt)}
                  </p>
                  <p className="text-gray-300 text-sm mt-1.5 whitespace-pre-line break-words">{q.question}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => abrir(q)} className={q.answer ? "btn-cyan text-xs px-3 py-1.5" : "btn-red text-xs px-4 py-1.5"}>
                    {abierta === q.id ? "Cerrar" : q.answer ? "Editar respuesta" : "Responder"}
                  </button>
                  <button onClick={() => eliminar(q)} aria-label="Eliminar pregunta" className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-700 text-gray-500 hover:text-[#E31E24] hover:border-[#E31E24]/50">✕</button>
                </div>
              </div>

              {q.answer && abierta !== q.id && (
                <div className="mt-3 rounded-lg bg-[rgba(0,192,231,0.06)] border border-[rgba(0,192,231,0.15)] p-3">
                  <p className="text-[11px] text-[#00C0E7] font-semibold">Tu respuesta · {q.answeredAt ? haceCuanto(q.answeredAt) : ""}</p>
                  <p className="text-gray-300 text-sm mt-1 whitespace-pre-line break-words">{q.answer}</p>
                </div>
              )}

              {abierta === q.id && (
                <div className="mt-3 space-y-2">
                  <textarea
                    autoFocus
                    rows={4}
                    value={texto}
                    onChange={(e) => setTexto(e.target.value.slice(0, 4000))}
                    placeholder="Escribe una respuesta clara. El alumno recibirá una notificación."
                    aria-label="Respuesta"
                    className="input-dark w-full resize-y text-sm"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <Link href={`/courses/${q.courseId}?leccion=${q.lessonId}#preguntas`} target="_blank" className="text-xs text-gray-500 hover:text-[#00C0E7]">
                      Ver la lección ↗
                    </Link>
                    <button onClick={() => responder(q)} disabled={guardando} className="btn-red text-sm px-5 py-2 disabled:opacity-60">
                      {guardando ? "Enviando..." : "Enviar respuesta"}
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Reseñas ─────────────────────────────────────────────────────────────────
function Resenas() {
  const [datos, setDatos] = useState<{ total: number; promedio: number; ocultas: number; items: Resena[] } | null>(null);
  const [curso, setCurso] = useState("");
  const [estrellas, setEstrellas] = useState(0);

  const cargar = () => reviewsApi.adminList().then(setDatos).catch(() => { setDatos({ total: 0, promedio: 0, ocultas: 0, items: [] }); toast.error("No se pudieron cargar las reseñas"); });
  useEffect(() => { cargar(); }, []);

  const cursos = useMemo(() => {
    const m = new Map<string, string>();
    datos?.items.forEach((r) => m.set(r.courseId, r.courseTitle ?? ""));
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [datos]);
  const visibles = (datos?.items ?? []).filter((r) => (!curso || r.courseId === curso) && (!estrellas || r.rating === estrellas));

  const alternar = async (r: Resena) => {
    try {
      await reviewsApi.setHidden(r.id, !r.hidden);
      toast.success(r.hidden ? "Reseña visible otra vez" : "Reseña ocultada");
      cargar();
    } catch (e) {
      toast.error(mensajeError(e, "No se pudo cambiar"));
    }
  };

  const eliminar = async (r: Resena) => {
    if (!window.confirm("¿Eliminar esta reseña? No se puede deshacer.")) return;
    try {
      await reviewsApi.adminRemove(r.id);
      toast.success("Reseña eliminada");
      cargar();
    } catch (e) {
      toast.error(mensajeError(e, "No se pudo eliminar"));
    }
  };

  if (!datos) return <div className="flex justify-center py-16"><div className="spinner-cyan" /></div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className={`${card} p-4`}>
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Promedio</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="font-brand text-[#00C0E7] text-2xl">{datos.total ? datos.promedio.toFixed(1) : "—"}</p>
            <Stars value={datos.promedio} size={14} className="hidden sm:inline-flex" />
          </div>
        </div>
        <div className={`${card} p-4`}>
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Reseñas</p>
          <p className="font-brand text-[#00C0E7] text-2xl mt-1">{datos.total}</p>
        </div>
        <div className={`${card} p-4`}>
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Ocultas</p>
          <p className="font-brand text-[#00C0E7] text-2xl mt-1">{datos.ocultas}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <select value={curso} onChange={(e) => setCurso(e.target.value)} aria-label="Filtrar por curso" className="input-dark text-sm sm:w-72">
          <option value="">Todos los cursos</option>
          {cursos.map(([id, t]) => <option key={id} value={id}>{t}</option>)}
        </select>
        <select value={estrellas} onChange={(e) => setEstrellas(Number(e.target.value))} aria-label="Filtrar por estrellas" className="input-dark text-sm sm:w-48">
          <option value={0}>Todas las estrellas</option>
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} estrella{n > 1 ? "s" : ""}</option>)}
        </select>
      </div>

      {visibles.length === 0 ? (
        <div className={`${card} p-10 text-center`}>
          <p className="text-white font-semibold">No hay reseñas</p>
          <p className="text-gray-500 text-sm mt-1">Los alumnos inscritos pueden calificar cada curso desde la pestaña Reseñas.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visibles.map((r) => (
            <li key={r.id} className={`${card} p-4 ${r.hidden ? "opacity-60" : ""}`}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-[#00C0E7] font-semibold truncate">{r.courseTitle}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-white text-sm font-semibold">{r.authorName}</span>
                    <Stars value={r.rating} size={14} />
                    <span className="text-gray-600 text-[11px]">{haceCuanto(r.updatedAt)}</span>
                    {r.hidden && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">Oculta</span>}
                  </div>
                  {r.comment
                    ? <p className="text-gray-300 text-sm mt-1.5 whitespace-pre-line break-words">{r.comment}</p>
                    : <p className="text-gray-600 text-sm mt-1.5 italic">Sin comentario</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => alternar(r)} className="btn-cyan text-xs px-3 py-1.5">{r.hidden ? "Mostrar" : "Ocultar"}</button>
                  <button onClick={() => eliminar(r)} aria-label="Eliminar reseña" className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-700 text-gray-500 hover:text-[#E31E24] hover:border-[#E31E24]/50">✕</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminCommunityPage() {
  const [vista, setVista] = useState<Vista>("preguntas");
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="font-brand text-[#00C0E7] text-2xl uppercase tracking-wide">Preguntas y reseñas</h1>
        <p className="text-gray-500 text-sm mt-1">Responde las dudas de los alumnos en cada lección y revisa lo que opinan de los cursos.</p>
      </div>
      <div className="flex gap-1 border-b border-gray-800">
        {([["preguntas", "Preguntas de alumnos"], ["resenas", "Reseñas de cursos"]] as [Vista, string][]).map(([k, t]) => (
          <button key={k} onClick={() => setVista(k)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap ${
              vista === k ? "border-[#00C0E7] text-[#00C0E7]" : "border-transparent text-gray-400 hover:text-white"
            }`}>
            {t}
          </button>
        ))}
      </div>
      {vista === "preguntas" ? <Preguntas /> : <Resenas />}
    </div>
  );
}
