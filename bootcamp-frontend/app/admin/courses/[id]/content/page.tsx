// src/app/admin/courses/[id]/content/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useContentApi, CourseModule } from "@/hooks/useContentApi";
import { useCoursesApi } from "@/hooks/useCoursesApi";

const leccionVacia = {
  title: "",
  description: "",
  videoUrl: "",
  duration: "",
};

export default function CourseContentPage() {
  const params = useParams();
  const courseId = params?.id as string;

  const { getCourseById } = useCoursesApi();
  const {
    getModulesByCourse,
    createModule,
    deleteModule,
    createLesson,
    deleteLesson,
  } = useContentApi();

  const [tituloCurso, setTituloCurso] = useState("");
  const [modulos, setModulos] = useState<CourseModule[]>([]);
  const [cargando, setCargando] = useState(true);

  const [moduloNuevo, setModuloNuevo] = useState({
    title: "",
    description: "",
  });
  const [moduloAbierto, setModuloAbierto] = useState<string | null>(null);
  const [leccionNueva, setLeccionNueva] = useState(leccionVacia);

  useEffect(() => {
    if (courseId) {
      cargarTodo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const cargarTodo = async () => {
    setCargando(true);
    const [curso, contenido] = await Promise.all([
      getCourseById(courseId),
      getModulesByCourse(courseId),
    ]);

    if (curso?.success && curso?.data) {
      setTituloCurso(curso.data.title ?? "");
    }
    setModulos(contenido.data ?? []);
    setCargando(false);
  };

  const recargarModulos = async () => {
    const contenido = await getModulesByCourse(courseId);
    setModulos(contenido.data ?? []);
  };

  const handleCrearModulo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!moduloNuevo.title.trim()) {
      toast.error("El módulo necesita un título");
      return;
    }

    const resultado = await createModule({
      title: moduloNuevo.title.trim(),
      description: moduloNuevo.description.trim() || undefined,
      courseId,
    });

    if (!resultado.success) {
      toast.error(resultado.error || "No se pudo crear el módulo");
      return;
    }

    toast.success("Módulo creado");
    setModuloNuevo({ title: "", description: "" });
    recargarModulos();
  };

  const handleEliminarModulo = async (id: string, titulo: string) => {
    const confirmado = window.confirm(
      `Se borrará "${titulo}" con todas sus lecciones y videos. ¿Continuar?`,
    );
    if (!confirmado) return;

    const resultado = await deleteModule(id);

    if (!resultado.success) {
      toast.error(resultado.error || "No se pudo eliminar");
      return;
    }

    toast.success("Módulo eliminado");
    recargarModulos();
  };

  const handleCrearLeccion = async (e: React.FormEvent, moduleId: string) => {
    e.preventDefault();

    if (!leccionNueva.title.trim()) {
      toast.error("La lección necesita un título");
      return;
    }

    const minutos = Number(leccionNueva.duration);

    const resultado = await createLesson({
      title: leccionNueva.title.trim(),
      description: leccionNueva.description.trim() || undefined,
      moduleId,
      videoUrl: leccionNueva.videoUrl.trim() || undefined,
      duration:
        leccionNueva.duration && !Number.isNaN(minutos)
          ? Math.round(minutos * 60)
          : undefined,
    });

    if (!resultado.success) {
      toast.error(resultado.error || "No se pudo crear la lección");
      return;
    }

    toast.success("Lección agregada");
    setLeccionNueva(leccionVacia);
    recargarModulos();
  };

  const handleEliminarLeccion = async (id: string, titulo: string) => {
    const confirmado = window.confirm(`¿Eliminar la lección "${titulo}"?`);
    if (!confirmado) return;

    const resultado = await deleteLesson(id);

    if (!resultado.success) {
      toast.error(resultado.error || "No se pudo eliminar");
      return;
    }

    toast.success("Lección eliminada");
    recargarModulos();
  };

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Cargando contenido...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/admin/courses"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Volver a cursos
        </Link>

        <h1 className="mt-3 text-3xl font-bold text-gray-900">
          Contenido del curso
        </h1>
        <p className="mt-1 text-gray-600">{tituloCurso}</p>

        {/* Crear módulo */}
        <form
          onSubmit={handleCrearModulo}
          className="mt-8 rounded-xl border border-gray-200 bg-white p-6"
        >
          <h2 className="font-semibold text-gray-900">Agregar un módulo</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <input
              type="text"
              value={moduloNuevo.title}
              onChange={(e) =>
                setModuloNuevo((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Título del módulo"
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
            <input
              type="text"
              value={moduloNuevo.description}
              onChange={(e) =>
                setModuloNuevo((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Descripción (opcional)"
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            Agregar módulo
          </button>
        </form>

        {/* Lista de módulos */}
        <div className="mt-8 space-y-4">
          {modulos.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
              <p className="text-gray-600">
                Este curso todavía no tiene módulos. Crea el primero arriba.
              </p>
            </div>
          )}

          {modulos.map((modulo) => (
            <div
              key={modulo.id}
              className="rounded-xl border border-gray-200 bg-white p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {modulo.orderNumber}. {modulo.title}
                  </h3>
                  {modulo.description && (
                    <p className="mt-1 text-sm text-gray-600">
                      {modulo.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleEliminarModulo(modulo.id, modulo.title)}
                  className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
                >
                  Eliminar
                </button>
              </div>

              {/* Lecciones */}
              <div className="mt-4 space-y-2">
                {modulo.lessons?.length === 0 && (
                  <p className="text-sm text-gray-500">
                    Sin lecciones todavía.
                  </p>
                )}

                {modulo.lessons?.map((leccion) => (
                  <div
                    key={leccion.id}
                    className="flex items-center justify-between gap-4 rounded-lg bg-gray-50 px-4 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {leccion.orderNumber}. {leccion.title}
                      </p>
                      {leccion.video?.videoUrl ? (
                        <p className="truncate text-xs text-gray-500">
                          {leccion.video.videoUrl}
                        </p>
                      ) : (
                        <p className="text-xs text-amber-700">
                          Falta el video
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        handleEliminarLeccion(leccion.id, leccion.title)
                      }
                      className="shrink-0 text-sm text-gray-500 hover:text-red-700"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>

              {/* Agregar lección */}
              {moduloAbierto === modulo.id ? (
                <form
                  onSubmit={(e) => handleCrearLeccion(e, modulo.id)}
                  className="mt-4 space-y-3 rounded-lg border border-gray-200 p-4"
                >
                  <input
                    type="text"
                    value={leccionNueva.title}
                    onChange={(e) =>
                      setLeccionNueva((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Título de la lección"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={leccionNueva.description}
                    onChange={(e) =>
                      setLeccionNueva((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Descripción (opcional)"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                  <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                    <input
                      type="text"
                      value={leccionNueva.videoUrl}
                      onChange={(e) =>
                        setLeccionNueva((prev) => ({
                          ...prev,
                          videoUrl: e.target.value,
                        }))
                      }
                      placeholder="Enlace del video (pega el de YouTube tal cual)"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      min="0"
                      value={leccionNueva.duration}
                      onChange={(e) =>
                        setLeccionNueva((prev) => ({
                          ...prev,
                          duration: e.target.value,
                        }))
                      }
                      placeholder="Minutos"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Guardar lección
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModuloAbierto(null);
                        setLeccionNueva(leccionVacia);
                      }}
                      className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => {
                    setModuloAbierto(modulo.id);
                    setLeccionNueva(leccionVacia);
                  }}
                  className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  + Agregar lección
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
