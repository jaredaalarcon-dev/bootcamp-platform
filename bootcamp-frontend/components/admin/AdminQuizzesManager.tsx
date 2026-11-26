// src/components/admin/AdminQuizzesManager.tsx — crear y editar cuestionarios del curso
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { CourseModule } from "@/hooks/useContentApi";
import { CuestionarioAdmin, GuardarCuestionario, mensajeError, quizzesApi } from "@/hooks/useCommunityApi";

interface PreguntaEditable { text: string; options: string[]; correctIndex: number; explanation: string }
interface Borrador {
  id?: string;
  ubicacion: string;          // "m:<id>" (final de módulo) o "l:<id>" (después de lección)
  title: string;
  description: string;
  passingScore: number;
  published: boolean;
  questions: PreguntaEditable[];
}

const LETRAS = ["A", "B", "C", "D", "E", "F"];
const preguntaVacia = (): PreguntaEditable => ({ text: "", options: ["", ""], correctIndex: 0, explanation: "" });

export function AdminQuizzesManager({ courseId, modulos }: { courseId: string; modulos: CourseModule[] }) {
  const [lista, setLista] = useState<CuestionarioAdmin[] | null>(null);
  const [borrador, setBorrador] = useState<Borrador | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [aEliminar, setAEliminar] = useState<CuestionarioAdmin | null>(null);

  const cargar = () => quizzesApi.adminList(courseId).then(setLista).catch(() => { setLista([]); toast.error("No se pudieron cargar los cuestionarios"); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargar(); }, [courseId]);

  const ordenados = [...modulos].sort((a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0));
  const nombreUbicacion = (q: { moduleId: string | null; lessonId: string | null }) => {
    if (q.moduleId) {
      const m = ordenados.find((x) => x.id === q.moduleId);
      return m ? `Final del módulo ${m.orderNumber}: ${m.title}` : "Módulo eliminado";
    }
    for (const m of ordenados) {
      const l = m.lessons?.find((x) => x.id === q.lessonId);
      if (l) return `Después de la lección: ${l.title}`;
    }
    return "Lección eliminada";
  };

  const nuevo = () => {
    const primerModulo = ordenados[0];
    if (!primerModulo) { toast.error("Primero crea un módulo en la pestaña Módulos y lecciones"); return; }
    setBorrador({ ubicacion: `m:${primerModulo.id}`, title: "", description: "", passingScore: 70, published: true, questions: [preguntaVacia()] });
    setTimeout(() => document.getElementById("editor-quiz")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const editar = (q: CuestionarioAdmin) => {
    setBorrador({
      id: q.id,
      ubicacion: q.moduleId ? `m:${q.moduleId}` : `l:${q.lessonId}`,
      title: q.title,
      description: q.description ?? "",
      passingScore: q.passingScore,
      published: q.published,
      questions: q.questions.map((p) => ({ text: p.text, options: [...p.options], correctIndex: p.correctIndex, explanation: p.explanation ?? "" })),
    });
    setTimeout(() => document.getElementById("editor-quiz")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  // ── Edición del borrador ──────────────────────────────────────────────────
  const setCampo = <K extends keyof Borrador>(k: K, v: Borrador[K]) => setBorrador((b) => (b ? { ...b, [k]: v } : b));
  const setPregunta = (i: number, cambio: Partial<PreguntaEditable>) =>
    setBorrador((b) => (b ? { ...b, questions: b.questions.map((p, j) => (j === i ? { ...p, ...cambio } : p)) } : b));
  const moverPregunta = (i: number, d: -1 | 1) =>
    setBorrador((b) => {
      if (!b) return b;
      const qs = [...b.questions];
      const j = i + d;
      if (j < 0 || j >= qs.length) return b;
      [qs[i], qs[j]] = [qs[j], qs[i]];
      return { ...b, questions: qs };
    });
  const quitarOpcion = (i: number, k: number) =>
    setBorrador((b) => {
      if (!b) return b;
      const p = b.questions[i];
      if (p.options.length <= 2) return b;
      const options = p.options.filter((_, x) => x !== k);
      const correctIndex = p.correctIndex === k ? 0 : p.correctIndex > k ? p.correctIndex - 1 : p.correctIndex;
      return { ...b, questions: b.questions.map((q, j) => (j === i ? { ...q, options, correctIndex } : q)) };
    });

  const validar = (b: Borrador): string | null => {
    if (b.title.trim().length < 3) return "Escribe un título para el cuestionario";
    if (!b.questions.length) return "Agrega al menos una pregunta";
    for (let i = 0; i < b.questions.length; i++) {
      const p = b.questions[i];
      if (p.text.trim().length < 3) return `Escribe el enunciado de la pregunta ${i + 1}`;
      const ops = p.options.map((o) => o.trim());
      if (ops.some((o) => !o)) return `La pregunta ${i + 1} tiene una opción vacía`;
      if (new Set(ops.map((o) => o.toLowerCase())).size !== ops.length) return `La pregunta ${i + 1} tiene opciones repetidas`;
    }
    return null;
  };

  const guardar = async () => {
    if (!borrador) return;
    const error = validar(borrador);
    if (error) { toast.error(error); return; }
    const [tipo, id] = borrador.ubicacion.split(":");
    const cuerpo: GuardarCuestionario = {
      courseId,
      moduleId: tipo === "m" ? id : null,
      lessonId: tipo === "l" ? id : null,
      title: borrador.title.trim(),
      description: borrador.description.trim() || undefined,
      passingScore: Math.max(0, Math.min(100, Math.round(borrador.passingScore || 0))),
      published: borrador.published,
      questions: borrador.questions.map((p) => ({
        text: p.text.trim(),
        options: p.options.map((o) => o.trim()),
        correctIndex: p.correctIndex,
        explanation: p.explanation.trim() || undefined,
      })),
    };
    setGuardando(true);
    try {
      if (borrador.id) await quizzesApi.update(borrador.id, cuerpo);
      else await quizzesApi.create(cuerpo);
      toast.success(borrador.id ? "Cuestionario actualizado" : "Cuestionario creado");
      setBorrador(null);
      cargar();
    } catch (e) {
      toast.error(mensajeError(e, "No se pudo guardar el cuestionario"));
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async () => {
    if (!aEliminar) return;
    try {
      await quizzesApi.remove(aEliminar.id);
      toast.success("Cuestionario eliminado");
      setAEliminar(null);
      if (borrador?.id === aEliminar.id) setBorrador(null);
      cargar();
    } catch (e) {
      toast.error(mensajeError(e, "No se pudo eliminar"));
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-semibold text-white">Cuestionarios</h2>
          <p className="text-gray-500 text-sm">Ponlos al final de un módulo o después de una lección. El alumno ve su nota al instante y puede reintentar.</p>
        </div>
        {!borrador && (
          <button onClick={nuevo} className="btn-red text-sm px-5 py-2 shrink-0">+ Nuevo cuestionario</button>
        )}
      </div>

      {/* Lista */}
      {lista === null ? (
        <div className="flex justify-center py-10"><div className="spinner-cyan" /></div>
      ) : lista.length === 0 && !borrador ? (
        <div className="card-dark p-8 text-center">
          <p className="text-white font-semibold">Este curso aún no tiene cuestionarios</p>
          <p className="text-gray-500 text-sm mt-1">Crea el primero para que tus alumnos pongan a prueba lo aprendido.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map((q) => (
            <div key={q.id} className={`card-dark p-4 ${borrador?.id === q.id ? "ring-2 ring-[#00C0E7]" : ""}`}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-white font-semibold">{q.title}</p>
                    {!q.published && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">Oculto</span>}
                  </div>
                  <p className="text-[#00C0E7] text-xs mt-0.5">{nombreUbicacion(q)}</p>
                  <p className="text-gray-500 text-xs mt-1">{q.questions.length} preguntas · Aprueba con {q.passingScore}%</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => editar(q)} className="btn-cyan text-xs px-3 py-1.5">Editar</button>
                  <button onClick={() => setAEliminar(q)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-[#E31E24] hover:border-[#E31E24]/50">Eliminar</button>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  ["Alumnos", q.stats.alumnos],
                  ["Intentos", q.stats.intentos],
                  ["Nota promedio", q.stats.intentos ? `${q.stats.promedio}%` : "—"],
                  ["Aprobaron", q.stats.alumnos ? `${q.stats.aprobados} de ${q.stats.alumnos}` : "—"],
                ].map(([t, v]) => (
                  <div key={t as string} className="rounded-lg bg-gray-800/60 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-gray-500">{t}</p>
                    <p className="text-white font-semibold text-sm">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor */}
      {borrador && (
        <div id="editor-quiz" className="card-dark p-4 sm:p-6 space-y-5 scroll-mt-4 border-t-4 border-t-[#00C0E7]">
          <h3 className="text-white font-semibold">{borrador.id ? "Editar cuestionario" : "Nuevo cuestionario"}</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label-dark block text-xs font-semibold mb-1" htmlFor="qz-ubicacion">¿Dónde aparece?</label>
              <select id="qz-ubicacion" value={borrador.ubicacion} onChange={(e) => setCampo("ubicacion", e.target.value)} className="input-dark w-full">
                {ordenados.map((m) => (
                  <optgroup key={m.id} label={`Módulo ${m.orderNumber}: ${m.title}`}>
                    <option value={`m:${m.id}`}>Examen al final del módulo {m.orderNumber}</option>
                    {(m.lessons ?? []).slice().sort((a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0)).map((l) => (
                      <option key={l.id} value={`l:${l.id}`}>Después de la lección: {l.title}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label-dark block text-xs font-semibold mb-1" htmlFor="qz-titulo">Título</label>
              <input id="qz-titulo" value={borrador.title} onChange={(e) => setCampo("title", e.target.value.slice(0, 200))} placeholder="Ej. Repaso del módulo 1" className="input-dark w-full" />
            </div>
            <div className="sm:col-span-2">
              <label className="label-dark block text-xs font-semibold mb-1" htmlFor="qz-desc">Indicaciones (opcional)</label>
              <textarea id="qz-desc" rows={2} value={borrador.description} onChange={(e) => setCampo("description", e.target.value.slice(0, 1000))} placeholder="Ej. Responde según lo visto en las lecciones del módulo." className="input-dark w-full resize-y" />
            </div>
            <div>
              <label className="label-dark block text-xs font-semibold mb-1" htmlFor="qz-nota">Nota mínima para aprobar (%)</label>
              <input id="qz-nota" type="number" min={0} max={100} value={borrador.passingScore} onChange={(e) => setCampo("passingScore", Number(e.target.value))} className="input-dark w-full" />
            </div>
            <label className="flex items-center gap-3 self-end pb-2 cursor-pointer">
              <input type="checkbox" checked={borrador.published} onChange={(e) => setCampo("published", e.target.checked)} className="h-4 w-4 accent-[#00C0E7]" />
              <span className="text-sm text-gray-300">Visible para los alumnos</span>
            </label>
          </div>

          <div className="space-y-4">
            {borrador.questions.map((p, i) => (
              <div key={i} className="rounded-xl border border-gray-800 bg-gray-900 p-3 sm:p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-[#00C0E7]">Pregunta {i + 1}</p>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => moverPregunta(i, -1)} disabled={i === 0} aria-label="Subir pregunta" className="p-1.5 rounded text-gray-500 hover:text-white disabled:opacity-30">↑</button>
                    <button type="button" onClick={() => moverPregunta(i, 1)} disabled={i === borrador.questions.length - 1} aria-label="Bajar pregunta" className="p-1.5 rounded text-gray-500 hover:text-white disabled:opacity-30">↓</button>
                    <button type="button" onClick={() => setCampo("questions", borrador.questions.filter((_, j) => j !== i))} disabled={borrador.questions.length === 1} aria-label="Eliminar pregunta" className="p-1.5 rounded text-gray-500 hover:text-[#E31E24] disabled:opacity-30">✕</button>
                  </div>
                </div>
                <textarea rows={2} value={p.text} onChange={(e) => setPregunta(i, { text: e.target.value.slice(0, 1000) })} placeholder="Escribe la pregunta" aria-label={`Enunciado de la pregunta ${i + 1}`} className="input-dark w-full resize-y" />
                <div className="space-y-2">
                  <p className="text-[11px] text-gray-500">Opciones: marca la respuesta correcta con el círculo.</p>
                  {p.options.map((op, k) => (
                    <div key={k} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPregunta(i, { correctIndex: k })}
                        aria-label={`Marcar la opción ${LETRAS[k]} como correcta`}
                        aria-pressed={p.correctIndex === k}
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold border ${
                          p.correctIndex === k ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-600 text-gray-400 hover:border-emerald-500"
                        }`}
                      >
                        {p.correctIndex === k ? "✓" : LETRAS[k]}
                      </button>
                      <input
                        value={op}
                        onChange={(e) => setPregunta(i, { options: p.options.map((o, x) => (x === k ? e.target.value.slice(0, 300) : o)) })}
                        placeholder={`Opción ${LETRAS[k]}`}
                        aria-label={`Opción ${LETRAS[k]} de la pregunta ${i + 1}`}
                        className="input-dark w-full min-w-0 text-sm"
                      />
                      <button type="button" onClick={() => quitarOpcion(i, k)} disabled={p.options.length <= 2} aria-label={`Quitar opción ${LETRAS[k]}`} className="p-1.5 text-gray-500 hover:text-[#E31E24] disabled:opacity-20">✕</button>
                    </div>
                  ))}
                  {p.options.length < 6 && (
                    <button type="button" onClick={() => setPregunta(i, { options: [...p.options, ""] })} className="text-xs font-semibold text-[#00C0E7] hover:underline">
                      + Agregar opción
                    </button>
                  )}
                </div>
                <textarea rows={2} value={p.explanation} onChange={(e) => setPregunta(i, { explanation: e.target.value.slice(0, 1000) })} placeholder="Explicación que verá el alumno al terminar (opcional)" aria-label={`Explicación de la pregunta ${i + 1}`} className="input-dark w-full resize-y text-sm" />
              </div>
            ))}
            {borrador.questions.length < 50 && (
              <button type="button" onClick={() => setCampo("questions", [...borrador.questions, preguntaVacia()])} className="w-full rounded-xl border-2 border-dashed border-gray-700 py-3 text-sm font-semibold text-gray-400 hover:text-[#00C0E7] hover:border-[#00C0E7]/50">
                + Agregar pregunta
              </button>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2 border-t border-gray-800">
            <button type="button" onClick={() => setBorrador(null)} className="text-sm text-gray-400 hover:text-white px-4 py-2">Cancelar</button>
            <button type="button" onClick={guardar} disabled={guardando} className="btn-red text-sm px-6 py-2 disabled:opacity-60">
              {guardando ? "Guardando..." : borrador.id ? "Guardar cambios" : "Crear cuestionario"}
            </button>
          </div>
        </div>
      )}

      {/* Confirmar eliminación */}
      {aEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setAEliminar(null)}>
          <div className="card-dark p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <p className="text-white font-semibold">¿Eliminar &quot;{aEliminar.title}&quot;?</p>
            <p className="text-gray-400 text-sm mt-2">Se borrarán sus preguntas y las notas de los alumnos. No se puede deshacer.</p>
            <div className="mt-5 flex gap-2 justify-end">
              <button onClick={() => setAEliminar(null)} className="text-sm text-gray-400 hover:text-white px-4 py-2">Cancelar</button>
              <button onClick={eliminar} className="btn-red text-sm px-5 py-2">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
