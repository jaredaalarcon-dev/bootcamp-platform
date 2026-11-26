// src/components/course/LessonQuestions.tsx — preguntas y comentarios de una lección
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { PreguntaLeccion, haceCuanto, mensajeError, questionsApi } from "@/hooks/useCommunityApi";

const MAX = 1500;

function Inicial({ nombre, equipo = false }: { nombre: string; equipo?: boolean }) {
  return (
    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
      equipo ? "bg-[#E31E24] text-white" : "bg-[#00C0E7] text-[#0d0d0d]"
    }`}>
      {equipo ? "JB" : (nombre?.[0] ?? "A").toUpperCase()}
    </span>
  );
}

export function LessonQuestions({ lessonId, enrolled }: { lessonId: string; enrolled: boolean }) {
  const [items, setItems] = useState<PreguntaLeccion[] | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [verTodas, setVerTodas] = useState(false);

  // El padre usa key={lessonId}: al cambiar de lección el componente empieza de cero
  useEffect(() => {
    if (!enrolled) return;
    let vigente = true;
    questionsApi.list(lessonId).then((r) => vigente && setItems(r)).catch(() => vigente && setItems([]));
    return () => { vigente = false; };
  }, [lessonId, enrolled]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = texto.trim();
    if (q.length < 5) { toast.error("Escribe tu pregunta con un poco más de detalle"); return; }
    setEnviando(true);
    try {
      const nueva = await questionsApi.ask(lessonId, q);
      setItems((p) => [nueva, ...(p ?? [])]);
      setTexto("");
      toast.success("Pregunta enviada. Te avisaremos cuando la respondan.");
    } catch (err) {
      toast.error(mensajeError(err, "No se pudo enviar tu pregunta"));
    } finally {
      setEnviando(false);
    }
  };

  const borrar = async (p: PreguntaLeccion) => {
    try {
      await questionsApi.remove(p.id);
      setItems((x) => x?.filter((i) => i.id !== p.id) ?? x);
      toast.success("Pregunta eliminada");
    } catch (err) {
      toast.error(mensajeError(err, "No se pudo eliminar"));
    }
  };

  const lista = items ?? [];
  const visibles = verTodas ? lista : lista.slice(0, 5);

  return (
    <section id="preguntas" className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-2xl p-4 sm:p-5 scroll-mt-20">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <svg className="w-4 h-4 text-[#00C0E7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          Preguntas de esta lección
          {lista.length > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">{lista.length}</span>}
        </h3>
      </div>

      {!enrolled ? (
        <p className="text-gray-500 text-sm">Inscríbete al curso para ver y hacer preguntas sobre esta lección.</p>
      ) : (
        <>
          <form onSubmit={enviar} className="space-y-2">
            <label htmlFor={`pregunta-${lessonId}`} className="sr-only">Tu pregunta</label>
            <textarea
              id={`pregunta-${lessonId}`}
              value={texto}
              onChange={(e) => setTexto(e.target.value.slice(0, MAX))}
              rows={3}
              placeholder="¿Tienes una duda sobre esta lección? Escríbela aquí y el equipo de SIJB te responderá."
              className="input-dark w-full resize-y min-h-[84px] text-sm"
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-gray-600">{texto.length}/{MAX}</span>
              <button type="submit" disabled={enviando || texto.trim().length < 5} className="btn-red text-sm px-5 py-2 disabled:opacity-50">
                {enviando ? "Enviando..." : "Preguntar"}
              </button>
            </div>
          </form>

          <div className="mt-5 space-y-4">
            {items === null ? (
              <div className="flex justify-center py-6"><div className="spinner-cyan" /></div>
            ) : lista.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">Nadie ha preguntado todavía. ¡Sé el primero!</p>
            ) : (
              visibles.map((p) => (
                <article key={p.id} className="space-y-3">
                  <div className="flex gap-3">
                    <Inicial nombre={p.authorName} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500">
                        <span className="text-white font-semibold">{p.mine ? "Tú" : p.authorName}</span> · {haceCuanto(p.createdAt)}
                      </p>
                      <p className="text-gray-300 text-sm mt-1 whitespace-pre-line break-words">{p.question}</p>
                      {!p.answer && (
                        <div className="mt-1.5 flex items-center gap-3">
                          <span className="text-[11px] font-semibold text-amber-400">Esperando respuesta</span>
                          {p.mine && (
                            <button onClick={() => borrar(p)} className="text-[11px] text-gray-500 hover:text-[#E31E24]">Eliminar</button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {p.answer && (
                    <div className="ml-6 sm:ml-11 flex gap-3 rounded-xl bg-[rgba(0,192,231,0.06)] border border-[rgba(0,192,231,0.15)] p-3">
                      <Inicial nombre="JB" equipo />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500">
                          <span className="text-[#00C0E7] font-semibold">{p.answeredBy ?? "Equipo SIJB"}</span>
                          {p.answeredAt && <> · {haceCuanto(p.answeredAt)}</>}
                        </p>
                        <p className="text-gray-300 text-sm mt-1 whitespace-pre-line break-words">{p.answer}</p>
                      </div>
                    </div>
                  )}
                </article>
              ))
            )}
            {lista.length > 5 && (
              <button onClick={() => setVerTodas((v) => !v)} className="w-full text-sm font-semibold text-[#00C0E7] py-2 hover:underline">
                {verTodas ? "Ver menos" : `Ver las ${lista.length} preguntas`}
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
