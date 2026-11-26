// src/components/course/QuizPlayer.tsx — resolver un cuestionario y ver el resultado
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CuestionarioAlumno, ResultadoCuestionario, mensajeError, quizzesApi } from "@/hooks/useCommunityApi";

interface Props {
  quizId: string;
  contexto?: string;                  // "Al final del módulo 1: Fundamentos"
  onTerminado?: (r: ResultadoCuestionario) => void;
  onSiguiente?: () => void;
}

const LETRAS = ["A", "B", "C", "D", "E", "F"];

export function QuizPlayer({ quizId, contexto, onTerminado, onSiguiente }: Props) {
  const [quiz, setQuiz] = useState<CuestionarioAlumno | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [respuestas, setRespuestas] = useState<Record<string, number>>({});
  const [resultado, setResultado] = useState<ResultadoCuestionario | null>(null);
  const [enviando, setEnviando] = useState(false);

  // El padre usa key={quizId}: al cambiar de cuestionario el componente empieza de cero
  useEffect(() => {
    quizzesApi.get(quizId).then(setQuiz).catch((e) => setError(mensajeError(e, "No se pudo abrir el cuestionario")));
  }, [quizId]);

  if (error) return (
    <div className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-2xl p-8 text-center">
      <p className="text-gray-400 text-sm">{error}</p>
    </div>
  );
  if (!quiz) return (
    <div className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-2xl p-12 flex justify-center"><div className="spinner-cyan" /></div>
  );

  const total = quiz.questions.length;
  const contestadas = Object.keys(respuestas).length;
  const porId = new Map(resultado?.results.map((r) => [r.questionId, r]));

  const enviar = async () => {
    if (contestadas < total) {
      toast.error(`Te faltan ${total - contestadas} pregunta${total - contestadas > 1 ? "s" : ""} por responder`);
      const falta = quiz.questions.find((q) => respuestas[q.id] === undefined);
      if (falta) document.getElementById(`pq-${falta.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setEnviando(true);
    try {
      const r = await quizzesApi.submit(quiz.id, respuestas);
      setResultado(r);
      setQuiz((q) => (q ? { ...q, bestScore: r.bestScore, attempts: r.attempts, passed: q.passed || r.passed } : q));
      onTerminado?.(r);
      document.getElementById("quiz-resultado")?.scrollIntoView({ behavior: "smooth", block: "start" });
      if (r.passed) toast.success(`¡Aprobaste con ${r.score}%!`);
    } catch (e) {
      toast.error(mensajeError(e, "No se pudo enviar tu cuestionario"));
    } finally {
      setEnviando(false);
    }
  };

  const reintentar = () => {
    setResultado(null);
    setRespuestas({});
    document.getElementById("quiz-inicio")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-4" id="quiz-inicio">
      {/* Cabecera */}
      <div className="bg-[#111827] border border-[rgba(0,192,231,0.2)] rounded-2xl p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(227,30,36,0.12)] text-[#E31E24]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            {contexto && <p className="text-[#00C0E7] text-[11px] font-bold uppercase tracking-wide">{contexto}</p>}
            <h2 className="text-white font-bold text-lg leading-snug">{quiz.title}</h2>
            {quiz.description && <p className="text-gray-400 text-sm mt-1">{quiz.description}</p>}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-gray-800 text-gray-300">{total} pregunta{total > 1 ? "s" : ""}</span>
          <span className="px-2.5 py-1 rounded-full bg-gray-800 text-gray-300">Apruebas con {quiz.passingScore}%</span>
          {quiz.attempts > 0 && (
            <span className={`px-2.5 py-1 rounded-full font-semibold ${quiz.passed ? "bg-emerald-500/10 text-emerald-400" : "bg-gray-800 text-gray-300"}`}>
              Mejor nota: {quiz.bestScore}% {quiz.passed ? "· Aprobado" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Resultado */}
      {resultado && (
        <div id="quiz-resultado" className={`scroll-mt-20 rounded-2xl p-5 border text-center ${
          resultado.passed ? "bg-emerald-500/10 border-emerald-500/30" : "bg-[rgba(227,30,36,0.08)] border-[rgba(227,30,36,0.3)]"
        }`}>
          <p className={`font-brand text-5xl ${resultado.passed ? "text-emerald-400" : "text-[#E31E24]"}`}>{resultado.score}%</p>
          <p className="text-white font-semibold mt-1">
            {resultado.passed ? "¡Aprobado! Buen trabajo." : `Te faltó poco. Necesitas ${resultado.passingScore}% para aprobar.`}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Respondiste bien {resultado.correctCount} de {resultado.totalQuestions}. Revisa abajo qué acertaste.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
            <button onClick={reintentar} className="btn-cyan text-sm px-5 py-2">Intentar de nuevo</button>
            {onSiguiente && <button onClick={onSiguiente} className="btn-red text-sm px-5 py-2">Continuar con el curso</button>}
          </div>
        </div>
      )}

      {/* Preguntas */}
      {quiz.questions.map((q, i) => {
        const r = porId.get(q.id);
        return (
          <fieldset
            key={q.id}
            id={`pq-${q.id}`}
            className={`scroll-mt-20 bg-[#111827] border rounded-2xl p-4 sm:p-5 ${
              r ? (r.correct ? "border-emerald-500/40" : "border-[rgba(227,30,36,0.4)]") : "border-[rgba(0,192,231,0.15)]"
            }`}
          >
            <legend className="sr-only">Pregunta {i + 1}</legend>
            <p className="text-xs font-bold text-gray-500 mb-1">Pregunta {i + 1} de {total}</p>
            <p className="text-white font-semibold text-sm sm:text-base whitespace-pre-line break-words">{q.text}</p>
            <div className="mt-3 space-y-2">
              {q.options.map((op, j) => {
                const elegida = (r ? r.chosen : respuestas[q.id]) === j;
                const esCorrecta = r && r.correctIndex === j;
                const estilo = r
                  ? esCorrecta
                    ? "border-emerald-500/60 bg-emerald-500/10"
                    : elegida ? "border-[rgba(227,30,36,0.6)] bg-[rgba(227,30,36,0.08)]" : "border-gray-800 opacity-70"
                  : elegida ? "border-[#00C0E7] bg-[rgba(0,192,231,0.1)]" : "border-gray-800 hover:border-gray-600";
                return (
                  <label
                    key={j}
                    className={`flex items-start gap-3 rounded-xl border p-3 transition-colors ${r ? "cursor-default" : "cursor-pointer"} ${estilo}`}
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      className="sr-only"
                      checked={elegida}
                      disabled={!!r}
                      onChange={() => setRespuestas((p) => ({ ...p, [q.id]: j }))}
                    />
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      r && esCorrecta ? "bg-emerald-500 text-white"
                        : r && elegida ? "bg-[#E31E24] text-white"
                        : elegida ? "bg-[#00C0E7] text-[#0d0d0d]" : "border border-gray-600 text-gray-400"
                    }`}>
                      {r && esCorrecta ? "✓" : r && elegida ? "✕" : LETRAS[j]}
                    </span>
                    <span className="text-gray-300 text-sm break-words pt-0.5">{op}</span>
                  </label>
                );
              })}
            </div>
            {r && (
              <div className="mt-3 text-sm">
                <p className={`font-semibold ${r.correct ? "text-emerald-400" : "text-[#E31E24]"}`}>
                  {r.correct ? "Correcto" : r.chosen < 0 ? "Sin responder" : "Incorrecto"}
                </p>
                {r.explanation && <p className="text-gray-400 mt-1 whitespace-pre-line">{r.explanation}</p>}
              </div>
            )}
          </fieldset>
        );
      })}

      {!resultado && (
        <div className="sticky bottom-0 -mx-1 px-1 pb-1 pt-2 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d] to-transparent">
          <button
            onClick={enviar}
            disabled={enviando}
            className="btn-red w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {enviando ? "Calificando..." : `Enviar respuestas (${contestadas}/${total})`}
          </button>
        </div>
      )}
    </div>
  );
}
