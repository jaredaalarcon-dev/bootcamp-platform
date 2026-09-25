// src/app/courses/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useCoursesApi } from "@/hooks/useCoursesApi";
import { useProgressApi } from "@/hooks/useProgressApi";
import { useAuth } from "@/hooks/useAuth";
import { StudentLayout } from "@/components/ui/StudentLayout";
import Link from "next/link";
import toast from "react-hot-toast";

// ── Tipos ───────────────────────────────────────────────────────────────────
interface Video  { id: string; title: string; videoUrl: string; duration: number; }
interface Lesson { id: string; title: string; description: string; orderNumber: number; video?: Video; }
interface Module { id: string; title: string; orderNumber: number; lessons: Lesson[]; }
interface Course { id: string; title: string; description: string; image: string; category?: { name: string }; modules: Module[]; }

type Tab = "modulos" | "acerca" | "recursos";

// ── Indicador de lección ────────────────────────────────────────────────────
function LessonIndicator({ completed, active, num }: { completed: boolean; active: boolean; num: number }) {
  if (completed) return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#00C0E7] text-white">
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
  if (active) return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#00C0E7] text-white text-xs font-bold">
      {num}
    </span>
  );
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-gray-600 text-gray-500 text-xs font-bold">
      {num}
    </span>
  );
}

// ── Página principal ────────────────────────────────────────────────────────
export default function CourseDetailPage() {
  const router   = useRouter();
  const params   = useParams();
  const courseId = params?.id as string;
  const { getToken } = useAuth();
  const { getCourseById, enrollCourse, checkEnrollment, loading } = useCoursesApi();
  const { getCourseProgress, toggleLesson } = useProgressApi();

  const [course,         setCourse]         = useState<Course | null>(null);
  const [enrolled,       setEnrolled]       = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [completadas,    setCompletadas]    = useState<string[]>([]);
  const [porcentaje,     setPorcentaje]     = useState(0);
  const [guardando,      setGuardando]      = useState(false);
  const [activeTab,      setActiveTab]      = useState<Tab>("modulos");

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    if (courseId) { loadCourse(); loadEnrollment(); loadProgress(); }
  }, [courseId]);

  const loadCourse = async () => {
    const r = await getCourseById(courseId);
    if (r.success && r.data) {
      setCourse(r.data);
      // Seleccionar la primera lección al cargar
      const first = r.data.modules?.[0]?.lessons?.[0];
      if (first) setSelectedLesson(first);
    }
  };
  const loadEnrollment = async () => {
    const r = await checkEnrollment(courseId);
    setEnrolled(r.enrolled);
  };
  const loadProgress = async () => {
    const r = await getCourseProgress(courseId);
    if (r.success && r.data) {
      setCompletadas(r.data.completedLessonIds || []);
      setPorcentaje(r.data.percentage || 0);
    }
  };

  const handleEnroll = async () => {
    const r = await enrollCourse(courseId);
    if (r.success) { setEnrolled(true); toast.success("¡Inscrito! Comienza a aprender."); }
    else toast.error(r.error || "Error al inscribirse");
  };

  const estaCompletada = (id: string) => completadas.includes(id);

  const handleToggle = async () => {
    if (!selectedLesson) return;
    const yaEstaba = estaCompletada(selectedLesson.id);
    setGuardando(true);
    const r = await toggleLesson(selectedLesson.id, !yaEstaba);
    setGuardando(false);
    if (!r.success) { toast.error(r.error || "No se pudo guardar"); return; }

    setCompletadas((prev) =>
      yaEstaba ? prev.filter((id) => id !== selectedLesson.id) : [...prev, selectedLesson.id],
    );
    if (r.data?.course?.percentage !== undefined) {
      setPorcentaje(r.data.course.percentage);
      if (r.data.course.percentage === 100) {
        toast.success("🎉 ¡Completaste el curso!");
        return;
      }
    }
    toast.success(yaEstaba ? "Lección desmarcada" : "✓ Lección marcada como completada");
  };

  // ── Navegación Anterior / Siguiente ───────────────────────────────────────
  const flatLessons: Lesson[] = course?.modules?.flatMap((m) => m.lessons) ?? [];
  const currentIdx = flatLessons.findIndex((l) => l.id === selectedLesson?.id);
  const prevLesson = currentIdx > 0 ? flatLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < flatLessons.length - 1 ? flatLessons[currentIdx + 1] : null;

  // ── Progreso por módulo ───────────────────────────────────────────────────
  const modProgress = (mod: Module) => ({
    completed: mod.lessons.filter((l) => completadas.includes(l.id)).length,
    total: mod.lessons.length,
  });

  // ── Ir a la primera lección incompleta ────────────────────────────────────
  const continuarCurso = () => {
    const primera = flatLessons.find((l) => !completadas.includes(l.id));
    if (primera) setSelectedLesson(primera);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!course) return (
    <div className="flex h-screen items-center justify-center bg-[#0d0d0d]">
      <div className="spinner-cyan" />
    </div>
  );

  const totalLessons = flatLessons.length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <StudentLayout>
      <div className="p-5 space-y-5 max-w-7xl mx-auto">

        {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/my-courses" className="hover:text-[#00C0E7] transition-colors">Mis cursos</Link>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-white truncate max-w-xs">{course.title}</span>
        </nav>

        {/* ── Card cabecera del curso ─────────────────────────────────────── */}
        <div className="bg-[#111827] border border-[rgba(0,192,231,0.2)] rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Thumbnail */}
          <div className="w-full sm:w-40 h-24 shrink-0 rounded-xl overflow-hidden bg-gray-800">
            {course.image ? (
              <img src={course.image} alt={course.title} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-900">
                <svg className="w-8 h-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.361a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {course.category?.name && (
              <span className="text-[#00C0E7] text-xs font-bold uppercase tracking-wide">{course.category.name}</span>
            )}
            <h1 className="font-brand text-[#00C0E7] text-xl uppercase tracking-wide mt-0.5 line-clamp-1">
              {course.title}
            </h1>
            <p className="text-gray-400 text-xs mt-1 line-clamp-1">{course.description}</p>
            {/* Barra de progreso */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00C0E7] rounded-full transition-all duration-500"
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
              <span className="text-[#00C0E7] font-bold text-sm shrink-0">{porcentaje}%</span>
            </div>
          </div>

          {/* CTA */}
          <div className="shrink-0 w-full sm:w-auto">
            {enrolled ? (
              <button
                onClick={continuarCurso}
                className="btn-red w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Continuar curso
              </button>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={loading}
                className="btn-red w-full sm:w-auto px-5 py-2.5 text-sm disabled:opacity-60"
              >
                {loading ? "Inscribiendo..." : "Inscribirse al curso"}
              </button>
            )}
          </div>
        </div>

        {/* ── Pestañas ───────────────────────────────────────────────────── */}
        <div className="flex border-b border-gray-800 gap-1">
          {(["modulos", "acerca", "recursos"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px capitalize ${
                activeTab === tab
                  ? "border-[#00C0E7] text-[#00C0E7]"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab === "modulos" ? "Módulos" : tab === "acerca" ? "Acerca del curso" : "Recursos"}
            </button>
          ))}
        </div>

        {/* ── Pestaña: Módulos ───────────────────────────────────────────── */}
        {activeTab === "modulos" && (
          <div className="grid gap-5 lg:grid-cols-[280px_1fr]">

            {/* Lista de módulos y lecciones */}
            <div className="space-y-5 lg:max-h-[600px] lg:overflow-y-auto lg:pr-2">
              {course.modules?.map((mod) => {
                const { completed, total } = modProgress(mod);
                const allDone = completed === total && total > 0;
                return (
                  <div key={mod.id}>
                    {/* Cabecera del módulo */}
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`text-sm font-bold ${allDone ? "text-[#00C0E7]" : "text-white"}`}>
                        Módulo {mod.orderNumber}: {mod.title}
                      </h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        allDone
                          ? "bg-[rgba(0,192,231,0.15)] text-[#00C0E7]"
                          : "bg-gray-800 text-gray-400"
                      }`}>
                        {completed}/{total}
                      </span>
                    </div>

                    {/* Lecciones del módulo */}
                    <div className="space-y-1">
                      {mod.lessons?.map((lesson, lIdx) => {
                        const done   = estaCompletada(lesson.id);
                        const active = selectedLesson?.id === lesson.id;
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => setSelectedLesson(lesson)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm ${
                              active
                                ? "bg-[rgba(0,192,231,0.12)] border border-[#00C0E7]/40"
                                : "hover:bg-gray-800/60"
                            }`}
                          >
                            <LessonIndicator completed={done} active={active} num={lIdx + 1} />
                            <span className={`line-clamp-1 ${
                              active ? "text-[#00C0E7] font-medium" : done ? "text-gray-300" : "text-gray-400"
                            }`}>
                              {lesson.title}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reproductor y contenido de la lección */}
            <div className="space-y-4">
              {selectedLesson ? (
                <>
                  {/* Título + navegación */}
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-white font-bold text-lg">{selectedLesson.title}</h2>
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => prevLesson && setSelectedLesson(prevLesson)}
                        disabled={!prevLesson}
                        className="btn-cyan text-xs px-3 py-1.5 flex items-center gap-1 disabled:opacity-30"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        Anterior
                      </button>
                      <button
                        onClick={() => nextLesson && setSelectedLesson(nextLesson)}
                        disabled={!nextLesson}
                        className="btn-cyan text-xs px-3 py-1.5 flex items-center gap-1 disabled:opacity-30"
                      >
                        Siguiente
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Video */}
                  {selectedLesson.video?.videoUrl ? (
                    <div className="bg-black rounded-2xl overflow-hidden border border-[rgba(0,192,231,0.15)]">
                      <iframe
                        width="100%"
                        height="400"
                        src={selectedLesson.video.videoUrl}
                        title={selectedLesson.video.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="block"
                      />
                    </div>
                  ) : (
                    <div className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-2xl h-48 flex items-center justify-center">
                      <p className="text-gray-600 text-sm">Esta lección no tiene video asignado.</p>
                    </div>
                  )}

                  {/* Descripción */}
                  {selectedLesson.description && (
                    <div className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-2xl p-5">
                      <h3 className="text-white font-semibold text-sm mb-2">Descripción</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{selectedLesson.description}</p>
                    </div>
                  )}

                  {/* Botón marcar como completada */}
                  {enrolled && (
                    <button
                      onClick={handleToggle}
                      disabled={guardando}
                      className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border-2 transition-all disabled:opacity-60 ${
                        estaCompletada(selectedLesson.id)
                          ? "border-gray-600 text-gray-400 bg-gray-800 hover:bg-gray-700"
                          : "border-[#00C0E7] text-[#00C0E7] hover:bg-[rgba(0,192,231,0.1)]"
                      }`}
                    >
                      {guardando ? (
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d={estaCompletada(selectedLesson.id)
                              ? "M6 18L18 6M6 6l12 12"
                              : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
                        </svg>
                      )}
                      {guardando
                        ? "Guardando..."
                        : estaCompletada(selectedLesson.id)
                          ? "Desmarcar lección"
                          : "Marcar como completada"}
                    </button>
                  )}

                  {!enrolled && (
                    <div className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-2xl p-4 text-center">
                      <p className="text-gray-500 text-sm mb-3">Inscríbete para registrar tu avance y desbloquear todas las funciones.</p>
                      <button onClick={handleEnroll} disabled={loading} className="btn-red text-sm px-6 py-2 disabled:opacity-60">
                        {loading ? "Inscribiendo..." : "Inscribirse al curso"}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-2xl p-12 text-center">
                  <p className="text-gray-500 text-sm">Selecciona una lección del panel izquierdo para comenzar.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Pestaña: Acerca del curso ───────────────────────────────────── */}
        {activeTab === "acerca" && (
          <div className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-2xl p-7">
            <h2 className="font-brand text-[#00C0E7] text-xl uppercase tracking-wide mb-4">
              Acerca del Curso
            </h2>
            <p className="text-gray-300 leading-relaxed">{course.description}</p>
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="bg-[rgba(0,192,231,0.05)] border border-[rgba(0,192,231,0.15)] rounded-xl p-4 text-center">
                <p className="font-brand text-[#00C0E7] text-2xl">{course.modules?.length ?? 0}</p>
                <p className="text-gray-400 text-xs mt-1">Módulos</p>
              </div>
              <div className="bg-[rgba(0,192,231,0.05)] border border-[rgba(0,192,231,0.15)] rounded-xl p-4 text-center">
                <p className="font-brand text-[#00C0E7] text-2xl">{totalLessons}</p>
                <p className="text-gray-400 text-xs mt-1">Lecciones</p>
              </div>
              <div className="bg-[rgba(0,192,231,0.05)] border border-[rgba(0,192,231,0.15)] rounded-xl p-4 text-center">
                <p className="font-brand text-[#00C0E7] text-2xl">{porcentaje}%</p>
                <p className="text-gray-400 text-xs mt-1">Tu progreso</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Pestaña: Recursos ──────────────────────────────────────────── */}
        {activeTab === "recursos" && (
          <div className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-2xl p-7 text-center">
            <svg className="w-12 h-12 text-gray-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-sm">Los recursos de este curso estarán disponibles próximamente.</p>
          </div>
        )}

      </div>
    </StudentLayout>
  );
}
