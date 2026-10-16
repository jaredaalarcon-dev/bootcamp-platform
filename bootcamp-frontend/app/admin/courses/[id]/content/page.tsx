// src/app/admin/courses/[id]/content/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useContentApi, CourseModule, Lesson } from "@/hooks/useContentApi";
import { useCoursesApi } from "@/hooks/useCoursesApi";
import { AdminResourcesManager } from "@/components/admin/AdminResourcesManager";

// ── Valores iniciales ────────────────────────────────────────────────────────
const LECCION_VACIA = { title: "", description: "", videoUrl: "", duration: "" };
const MOD_EDICION_VACIO = { title: "", description: "" };
const LEC_EDICION_VACIA = { title: "", description: "", videoUrl: "", duration: "" };

export default function CourseContentPage() {
  const params = useParams();
  const courseId = params?.id as string;

  const { getCourseById } = useCoursesApi();
  const {
    getModulesByCourse, createModule, updateModule, deleteModule,
    createLesson,   updateLesson,  deleteLesson,
  } = useContentApi();

  const [seccion, setSeccion]           = useState<"contenido" | "recursos">("contenido");
  const [tituloCurso, setTituloCurso]   = useState("");
  const [modulos, setModulos]           = useState<CourseModule[]>([]);
  const [cargando, setCargando]         = useState(true);

  // ── Crear módulo ─────────────────────────────────────────────────────────
  const [moduloNuevo, setModuloNuevo]   = useState({ title: "", description: "" });

  // ── Editar módulo ────────────────────────────────────────────────────────
  const [moduloEditando, setModuloEditando]   = useState<string | null>(null);
  const [modEdicion, setModEdicion]           = useState(MOD_EDICION_VACIO);

  // ── Crear lección ────────────────────────────────────────────────────────
  const [panelLeccion, setPanelLeccion] = useState<string | null>(null); // moduleId
  const [leccionNueva, setLeccionNueva] = useState(LECCION_VACIA);

  // ── Editar lección ───────────────────────────────────────────────────────
  const [leccionEditando, setLeccionEditando] = useState<string | null>(null);
  const [lecEdicion, setLecEdicion]           = useState(LEC_EDICION_VACIA);

  useEffect(() => { if (courseId) cargarTodo(); }, [courseId]);

  // ── Carga ────────────────────────────────────────────────────────────────
  const cargarTodo = async () => {
    setCargando(true);
    const [curso, contenido] = await Promise.all([
      getCourseById(courseId),
      getModulesByCourse(courseId),
    ]);
    if (curso?.success && curso?.data) setTituloCurso(curso.data.title ?? "");
    setModulos(contenido.data ?? []);
    setCargando(false);
  };

  const recargarModulos = async () => {
    const contenido = await getModulesByCourse(courseId);
    setModulos(contenido.data ?? []);
  };

  // ── Crear módulo ─────────────────────────────────────────────────────────
  const handleCrearModulo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduloNuevo.title.trim()) { toast.error("El módulo necesita un título"); return; }
    const r = await createModule({ title: moduloNuevo.title.trim(), description: moduloNuevo.description.trim() || undefined, courseId });
    if (!r.success) { toast.error(r.error || "No se pudo crear el módulo"); return; }
    toast.success("Módulo creado");
    setModuloNuevo({ title: "", description: "" });
    recargarModulos();
  };

  // ── Editar módulo ────────────────────────────────────────────────────────
  const abrirEdicionModulo = (m: CourseModule) => {
    setModuloEditando(m.id);
    setModEdicion({ title: m.title, description: m.description ?? "" });
  };

  const handleGuardarModulo = async (id: string) => {
    if (!modEdicion.title.trim()) { toast.error("El título no puede estar vacío"); return; }
    const r = await updateModule(id, { title: modEdicion.title.trim(), description: modEdicion.description.trim() || undefined });
    if (!r.success) { toast.error(r.error || "No se pudo guardar"); return; }
    toast.success("Módulo actualizado");
    setModuloEditando(null);
    recargarModulos();
  };

  // ── Eliminar módulo ──────────────────────────────────────────────────────
  const handleEliminarModulo = async (id: string, titulo: string) => {
    if (!window.confirm(`Se borrará "${titulo}" con todas sus lecciones. ¿Continuar?`)) return;
    const r = await deleteModule(id);
    if (!r.success) { toast.error(r.error || "No se pudo eliminar"); return; }
    toast.success("Módulo eliminado");
    recargarModulos();
  };

  // ── Reordenar módulos ────────────────────────────────────────────────────
  const moverModulo = async (idx: number, dir: "arriba" | "abajo") => {
    const vecino = dir === "arriba" ? modulos[idx - 1] : modulos[idx + 1];
    if (!vecino) return;
    const actual = modulos[idx];

    // Intercambiamos los orderNumbers de los dos módulos
    const [r1, r2] = await Promise.all([
      updateModule(actual.id,  { orderNumber: vecino.orderNumber }),
      updateModule(vecino.id,  { orderNumber: actual.orderNumber }),
    ]);

    if (!r1.success || !r2.success) { toast.error("No se pudo reordenar"); return; }
    recargarModulos();
  };

  // ── Crear lección ────────────────────────────────────────────────────────
  const handleCrearLeccion = async (e: React.FormEvent, moduleId: string) => {
    e.preventDefault();
    if (!leccionNueva.title.trim()) { toast.error("La lección necesita un título"); return; }
    const minutos = Number(leccionNueva.duration);
    const r = await createLesson({
      title: leccionNueva.title.trim(),
      description: leccionNueva.description.trim() || undefined,
      moduleId,
      videoUrl: leccionNueva.videoUrl.trim() || undefined,
      duration: leccionNueva.duration && !isNaN(minutos) ? Math.round(minutos * 60) : undefined,
    });
    if (!r.success) { toast.error(r.error || "No se pudo crear la lección"); return; }
    toast.success("Lección agregada");
    setLeccionNueva(LECCION_VACIA);
    recargarModulos();
  };

  // ── Editar lección ───────────────────────────────────────────────────────
  const abrirEdicionLeccion = (l: Lesson) => {
    setLeccionEditando(l.id);
    setLecEdicion({
      title: l.title,
      description: l.description ?? "",
      videoUrl: l.video?.videoUrl ?? "",
      duration: l.video?.duration ? String(Math.round(l.video.duration / 60)) : "",
    });
  };

  const handleGuardarLeccion = async (id: string) => {
    if (!lecEdicion.title.trim()) { toast.error("El título no puede estar vacío"); return; }
    const minutos = Number(lecEdicion.duration);
    const r = await updateLesson(id, {
      title: lecEdicion.title.trim(),
      description: lecEdicion.description.trim() || undefined,
      videoUrl: lecEdicion.videoUrl.trim() || undefined,
      duration: lecEdicion.duration && !isNaN(minutos) ? Math.round(minutos * 60) : undefined,
    });
    if (!r.success) { toast.error(r.error || "No se pudo guardar"); return; }
    toast.success("Lección actualizada");
    setLeccionEditando(null);
    recargarModulos();
  };

  // ── Eliminar lección ─────────────────────────────────────────────────────
  const handleEliminarLeccion = async (id: string, titulo: string) => {
    if (!window.confirm(`¿Eliminar la lección "${titulo}"?`)) return;
    const r = await deleteLesson(id);
    if (!r.success) { toast.error(r.error || "No se pudo eliminar"); return; }
    toast.success("Lección eliminada");
    recargarModulos();
  };

  // ── Reordenar lecciones ──────────────────────────────────────────────────
  const moverLeccion = async (lecciones: Lesson[], idx: number, dir: "arriba" | "abajo") => {
    const vecino = dir === "arriba" ? lecciones[idx - 1] : lecciones[idx + 1];
    if (!vecino) return;
    const actual = lecciones[idx];
    const [r1, r2] = await Promise.all([
      updateLesson(actual.id, { orderNumber: vecino.orderNumber }),
      updateLesson(vecino.id, { orderNumber: actual.orderNumber }),
    ]);
    if (!r1.success || !r2.success) { toast.error("No se pudo reordenar"); return; }
    recargarModulos();
  };

  // ── Render ───────────────────────────────────────────────────────────────
  if (cargando) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="spinner-cyan" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin/courses" className="text-sm text-gray-400 hover:text-white">
          ← Volver a cursos
        </Link>
        <h1 className="mt-3 font-brand text-[#00C0E7] text-2xl uppercase tracking-wide">Contenido del curso</h1>
        <p className="mt-1 text-gray-400">{tituloCurso}</p>

        {/* ── Pestañas: módulos/lecciones y recursos ───────────────────── */}
        <div className="mt-6 flex gap-1 border-b border-gray-800">
          {([["contenido", "Módulos y lecciones"], ["recursos", "Recursos"]] as const).map(([k, label]) => (
            <button key={k} type="button" onClick={() => setSeccion(k)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                seccion === k ? "border-[#00C0E7] text-[#00C0E7]" : "border-transparent text-gray-400 hover:text-white"
              }`}>
              {label}
            </button>
          ))}
        </div>

        {seccion === "recursos" && (
          <div className="mt-8"><AdminResourcesManager courseId={courseId} /></div>
        )}

        {seccion === "contenido" && (<>
        {/* ── Crear módulo ─────────────────────────────────────────────── */}
        <form onSubmit={handleCrearModulo} className="mt-8 card-dark p-6">
          <h2 className="font-semibold text-white">Agregar un módulo</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <input type="text" value={moduloNuevo.title}
              onChange={(e) => setModuloNuevo((p) => ({ ...p, title: e.target.value }))}
              placeholder="Título del módulo"
              className="input-dark" />
            <input type="text" value={moduloNuevo.description}
              onChange={(e) => setModuloNuevo((p) => ({ ...p, description: e.target.value }))}
              placeholder="Descripción (opcional)"
              className="input-dark" />
          </div>
          <button type="submit" className="mt-4 btn-red px-4 py-2 ">
            Agregar módulo
          </button>
        </form>

        {/* ── Lista de módulos ─────────────────────────────────────────── */}
        <div className="mt-8 space-y-4">
          {modulos.length === 0 && (
            <div className="rounded-xl border border-dashed border-[rgba(0,192,231,0.3)] bg-[#111827] p-10 text-center">
              <p className="text-gray-400">Este curso todavía no tiene módulos. Crea el primero arriba.</p>
            </div>
          )}

          {modulos.map((modulo, modIdx) => (
            <div key={modulo.id} className="card-dark p-6">

              {/* Cabecera del módulo */}
              {moduloEditando === modulo.id ? (
                /* ── Modo edición ── */
                <div className="space-y-3">
                  <input type="text" value={modEdicion.title}
                    onChange={(e) => setModEdicion((p) => ({ ...p, title: e.target.value }))}
                    className="input-dark w-full font-semibold" />
                  <input type="text" value={modEdicion.description}
                    onChange={(e) => setModEdicion((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Descripción (opcional)"
                    className="input-dark w-full" />
                  <div className="flex gap-2">
                    <button onClick={() => handleGuardarModulo(modulo.id)}
                      className="btn-red px-4 py-1.5 text-sm ">
                      Guardar
                    </button>
                    <button onClick={() => setModuloEditando(null)}
                      className="rounded-lg px-4 py-1.5 text-sm text-gray-400 hover:text-white">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Modo vista ── */
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {/* Botones de reorden */}
                    <div className="flex flex-col gap-0.5 pt-0.5">
                      <button onClick={() => moverModulo(modIdx, "arriba")} disabled={modIdx === 0}
                        title="Subir módulo"
                        className="rounded p-0.5 text-gray-400 hover:text-[#00C0E7] disabled:opacity-20">
                        ▲
                      </button>
                      <button onClick={() => moverModulo(modIdx, "abajo")} disabled={modIdx === modulos.length - 1}
                        title="Bajar módulo"
                        className="rounded p-0.5 text-gray-400 hover:text-[#00C0E7] disabled:opacity-20">
                        ▼
                      </button>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">
                        {modulo.orderNumber}. {modulo.title}
                      </h3>
                      {modulo.description && (
                        <p className="mt-0.5 text-sm text-gray-400">{modulo.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => abrirEdicionModulo(modulo)}
                      className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:border-[#00C0E7] hover:text-[#00C0E7]">
                      ✏️ Editar
                    </button>
                    <button onClick={() => handleEliminarModulo(modulo.id, modulo.title)}
                      className="rounded-lg border border-[rgba(231,30,36,0.4)] px-3 py-1.5 text-sm text-[#E31E24] hover:bg-[rgba(231,30,36,0.1)]">
                      Eliminar
                    </button>
                  </div>
                </div>
              )}

              {/* Lecciones */}
              <div className="mt-4 space-y-2">
                {modulo.lessons?.length === 0 && (
                  <p className="text-sm text-gray-500">Sin lecciones todavía.</p>
                )}

                {modulo.lessons?.map((leccion, lecIdx) => (
                  <div key={leccion.id} className="rounded-lg border border-gray-800 bg-[#0d0d0d] px-4 py-3">
                    {leccionEditando === leccion.id ? (
                      /* ── Edición de lección ── */
                      <div className="space-y-2">
                        <input type="text" value={lecEdicion.title}
                          onChange={(e) => setLecEdicion((p) => ({ ...p, title: e.target.value }))}
                          className="input-dark w-full text-sm" />
                        <input type="text" value={lecEdicion.description}
                          onChange={(e) => setLecEdicion((p) => ({ ...p, description: e.target.value }))}
                          placeholder="Descripción (opcional)"
                          className="input-dark w-full text-sm" />
                        <div className="grid gap-2 sm:grid-cols-[1fr_110px]">
                          <input type="text" value={lecEdicion.videoUrl}
                            onChange={(e) => setLecEdicion((p) => ({ ...p, videoUrl: e.target.value }))}
                            placeholder="Enlace del video"
                            className="input-dark w-full text-sm" />
                          <input type="number" min="0" value={lecEdicion.duration}
                            onChange={(e) => setLecEdicion((p) => ({ ...p, duration: e.target.value }))}
                            placeholder="Minutos"
                            className="input-dark w-full text-sm" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleGuardarLeccion(leccion.id)}
                            className="btn-red px-3 py-1 text-xs ">
                            Guardar
                          </button>
                          <button onClick={() => setLeccionEditando(null)}
                            className="rounded-lg px-3 py-1 text-xs text-gray-400 hover:text-white">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ── Vista de lección ── */
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Reorden de lecciones */}
                          <div className="flex flex-col gap-0.5">
                            <button onClick={() => moverLeccion(modulo.lessons!, lecIdx, "arriba")} disabled={lecIdx === 0}
                              title="Subir lección"
                              className="text-[10px] text-gray-400 hover:text-[#00C0E7] disabled:opacity-20 leading-none">
                              ▲
                            </button>
                            <button onClick={() => moverLeccion(modulo.lessons!, lecIdx, "abajo")} disabled={lecIdx === (modulo.lessons?.length ?? 0) - 1}
                              title="Bajar lección"
                              className="text-[10px] text-gray-400 hover:text-[#00C0E7] disabled:opacity-20 leading-none">
                              ▼
                            </button>
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">
                              {leccion.orderNumber}. {leccion.title}
                            </p>
                            {leccion.video?.videoUrl ? (
                              <p className="truncate text-xs text-gray-500">{leccion.video.videoUrl}</p>
                            ) : (
                              <p className="text-xs text-[#E31E24]">Falta el video</p>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button onClick={() => abrirEdicionLeccion(leccion)}
                            className="text-sm text-gray-500 hover:text-[#00C0E7]">
                            ✏️
                          </button>
                          <button onClick={() => handleEliminarLeccion(leccion.id, leccion.title)}
                            className="text-sm text-gray-500 hover:text-[#E31E24]">
                            🗑
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Agregar lección */}
              {panelLeccion === modulo.id ? (
                <form onSubmit={(e) => handleCrearLeccion(e, modulo.id)}
                  className="mt-4 space-y-3 rounded-lg border border-[rgba(0,192,231,0.25)] bg-[#0d0d0d] p-4">
                  <input type="text" value={leccionNueva.title}
                    onChange={(e) => setLeccionNueva((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Título de la lección"
                    className="input-dark w-full" />
                  <input type="text" value={leccionNueva.description}
                    onChange={(e) => setLeccionNueva((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Descripción (opcional)"
                    className="input-dark w-full" />
                  <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                    <input type="text" value={leccionNueva.videoUrl}
                      onChange={(e) => setLeccionNueva((p) => ({ ...p, videoUrl: e.target.value }))}
                      placeholder="Enlace del video (YouTube, Vimeo…)"
                      className="input-dark w-full" />
                    <input type="number" min="0" value={leccionNueva.duration}
                      onChange={(e) => setLeccionNueva((p) => ({ ...p, duration: e.target.value }))}
                      placeholder="Minutos"
                      className="input-dark w-full" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit"
                      className="btn-red px-4 py-2 text-sm ">
                      Guardar lección
                    </button>
                    <button type="button" onClick={() => { setPanelLeccion(null); setLeccionNueva(LECCION_VACIA); }}
                      className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white">
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <button onClick={() => { setPanelLeccion(modulo.id); setLeccionNueva(LECCION_VACIA); }}
                  className="mt-4 text-sm font-medium text-[#00C0E7] hover:text-white">
                  + Agregar lección
                </button>
              )}
            </div>
          ))}
        </div>
        </>)}
      </div>
    </div>
  );
}
