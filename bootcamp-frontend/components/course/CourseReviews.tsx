// src/components/course/CourseReviews.tsx — calificación con estrellas y reseñas
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Stars } from "@/components/ui/Stars";
import { ResumenResenas, haceCuanto, mensajeError, reviewsApi } from "@/hooks/useCommunityApi";

const MAX = 1000;
const ETIQUETAS = ["", "Malo", "Regular", "Bueno", "Muy bueno", "Excelente"];

export function CourseReviews({ courseId, porcentaje, onCambio }: { courseId: string; porcentaje: number; onCambio?: (promedio: number, total: number) => void }) {
  const [datos, setDatos] = useState<ResumenResenas | null>(null);
  const [editando, setEditando] = useState(false);
  const [rating, setRating] = useState(0);
  const [comentario, setComentario] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargar = () =>
    reviewsApi.forCourse(courseId)
      .then((d) => {
        setDatos(d);
        onCambio?.(d.promedio, d.total);
        if (d.mine) { setRating(d.mine.rating); setComentario(d.mine.comment ?? ""); }
      })
      .catch(() => setDatos({ total: 0, promedio: 0, distribucion: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, items: [], mine: null, canReview: false }));

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargar(); }, [courseId]);

  if (!datos) return <div className="flex justify-center py-12"><div className="spinner-cyan" /></div>;

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) { toast.error("Elige de 1 a 5 estrellas"); return; }
    setGuardando(true);
    try {
      await reviewsApi.save(courseId, rating, comentario.trim());
      toast.success(datos.mine ? "Reseña actualizada" : "¡Gracias por tu reseña!");
      setEditando(false);
      await cargar();
    } catch (err) {
      toast.error(mensajeError(err, "No se pudo guardar tu reseña"));
    } finally {
      setGuardando(false);
    }
  };

  const borrar = async () => {
    try {
      await reviewsApi.remove(courseId);
      setRating(0); setComentario(""); setEditando(false);
      toast.success("Reseña eliminada");
      await cargar();
    } catch (err) {
      toast.error(mensajeError(err, "No se pudo eliminar"));
    }
  };

  const mostrarFormulario = datos.canReview && (!datos.mine || editando);
  const otras = datos.items.filter((r) => !r.mine);

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      {/* Resumen */}
      <div className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-2xl p-5 h-fit">
        <div className="flex items-center gap-4">
          <p className="font-brand text-[#00C0E7] text-5xl leading-none">{datos.total ? datos.promedio.toFixed(1) : "—"}</p>
          <div>
            <Stars value={datos.promedio} size={20} />
            <p className="text-gray-500 text-xs mt-1">{datos.total} reseña{datos.total === 1 ? "" : "s"}</p>
          </div>
        </div>
        <div className="mt-5 space-y-2">
          {[5, 4, 3, 2, 1].map((n) => {
            const c = datos.distribucion[n as 1 | 2 | 3 | 4 | 5] ?? 0;
            const pct = datos.total ? Math.round((c / datos.total) * 100) : 0;
            return (
              <div key={n} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-gray-400 text-right">{n}</span>
                <svg className="w-3 h-3 text-[#F5B301]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.94 5.96 6.56.95-4.75 4.63 1.12 6.54L12 17.5l-5.87 3.08 1.12-6.54L2.5 9.41l6.56-.95L12 2.5z" /></svg>
                <div className="flex-1 h-2 rounded-full bg-gray-800 overflow-hidden">
                  <div className="h-full rounded-full bg-[#F5B301]" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right text-gray-500">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        {/* Mi reseña */}
        {!datos.canReview ? (
          <div className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-2xl p-4 text-sm text-gray-500">
            Inscríbete al curso para dejar tu calificación.
          </div>
        ) : mostrarFormulario ? (
          <form onSubmit={guardar} className="bg-[#111827] border border-[rgba(0,192,231,0.2)] rounded-2xl p-4 sm:p-5 space-y-3">
            <div>
              <p className="text-white font-semibold text-sm">{datos.mine ? "Editar mi reseña" : "¿Qué te pareció el curso?"}</p>
              {!datos.mine && porcentaje < 30 && (
                <p className="text-gray-500 text-xs mt-0.5">Puedes calificarlo ahora y cambiar tu opinión cuando avances más.</p>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Stars value={rating} size={30} onChange={setRating} label="Tu calificación" />
              {rating > 0 && <span className="text-sm font-semibold text-[#F5B301]">{ETIQUETAS[rating]}</span>}
            </div>
            <div>
              <label htmlFor="resena" className="sr-only">Tu reseña</label>
              <textarea
                id="resena"
                value={comentario}
                onChange={(e) => setComentario(e.target.value.slice(0, MAX))}
                rows={3}
                placeholder="Cuéntanos qué te gustó y qué podríamos mejorar (opcional)"
                className="input-dark w-full resize-y text-sm"
              />
              <p className="text-[11px] text-gray-600 text-right">{comentario.length}/{MAX}</p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              {datos.mine && (
                <button type="button" onClick={() => { setEditando(false); setRating(datos.mine!.rating); setComentario(datos.mine!.comment ?? ""); }} className="text-sm text-gray-400 hover:text-white px-4 py-2">
                  Cancelar
                </button>
              )}
              <button type="submit" disabled={guardando || !rating} className="btn-red text-sm px-6 py-2 disabled:opacity-50">
                {guardando ? "Guardando..." : datos.mine ? "Guardar cambios" : "Publicar reseña"}
              </button>
            </div>
          </form>
        ) : datos.mine && (
          <div className="bg-[rgba(0,192,231,0.06)] border border-[rgba(0,192,231,0.25)] rounded-2xl p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[#00C0E7] text-xs font-bold uppercase tracking-wide">Tu reseña</p>
                <Stars value={datos.mine.rating} size={18} className="mt-1" />
              </div>
              <div className="flex gap-3 text-xs font-semibold shrink-0">
                <button onClick={() => setEditando(true)} className="text-[#00C0E7] hover:underline">Editar</button>
                <button onClick={borrar} className="text-gray-500 hover:text-[#E31E24]">Eliminar</button>
              </div>
            </div>
            {datos.mine.comment && <p className="text-gray-300 text-sm mt-2 whitespace-pre-line break-words">{datos.mine.comment}</p>}
            {datos.mine.hidden && <p className="text-amber-400 text-xs mt-2">El equipo ocultó esta reseña: no la ven los demás alumnos.</p>}
          </div>
        )}

        {/* Reseñas de otros alumnos */}
        {otras.length === 0 ? (
          <div className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-2xl p-8 text-center">
            <p className="text-gray-400 text-sm">{datos.mine ? "Eres el primero en calificar este curso." : "Todavía no hay reseñas de otros alumnos."}</p>
          </div>
        ) : (
          <ul className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-2xl divide-y divide-gray-800">
            {otras.map((r) => (
              <li key={r.id} className="p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00C0E7] text-[#0d0d0d] text-xs font-bold">
                    {(r.authorName?.[0] ?? "A").toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{r.authorName}</p>
                    <div className="flex items-center gap-2">
                      <Stars value={r.rating} size={13} />
                      <span className="text-gray-600 text-[11px]">{haceCuanto(r.updatedAt)}</span>
                    </div>
                  </div>
                </div>
                {r.comment && <p className="text-gray-300 text-sm mt-2 whitespace-pre-line break-words">{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
