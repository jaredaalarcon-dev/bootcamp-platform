// src/app/courses/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useCoursesApi } from "@/hooks/useCoursesApi";
import { useProgressApi } from "@/hooks/useProgressApi";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import toast from "react-hot-toast";

interface Lesson {
  id: string;
  title: string;
  description: string;
  orderNumber: number;
  video?: {
    id: string;
    title: string;
    videoUrl: string;
    duration: number;
  };
}

interface Module {
  id: string;
  title: string;
  description: string;
  orderNumber: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  image: string;
  category: {
    name: string;
  };
  modules: Module[];
}

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;
  const { getToken } = useAuth();
  const { getCourseById, enrollCourse, checkEnrollment, loading } =
    useCoursesApi();
  const { getCourseProgress, toggleLesson } = useProgressApi();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [completadas, setCompletadas] = useState<string[]>([]);
  const [porcentaje, setPorcentaje] = useState(0);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    if (courseId) {
      loadCourse();
      loadEnrollment();
      loadProgress();
    }
  }, [courseId]);

  const loadCourse = async () => {
    const result = await getCourseById(courseId);
    if (result.success && result.data) {
      setCourse(result.data);
      if (result.data.modules && result.data.modules.length > 0) {
        const firstLesson = result.data.modules[0].lessons[0];
        if (firstLesson) {
          setSelectedLesson(firstLesson);
        }
      }
    }
  };

  const loadEnrollment = async () => {
    const resultado = await checkEnrollment(courseId);
    setEnrolled(resultado.enrolled);
  };

  const loadProgress = async () => {
    const resultado = await getCourseProgress(courseId);
    if (resultado.success && resultado.data) {
      setCompletadas(resultado.data.completedLessonIds || []);
      setPorcentaje(resultado.data.percentage || 0);
    }
  };

  const handleEnroll = async () => {
    const result = await enrollCourse(courseId);
    if (result.success) {
      setEnrolled(true);
      toast.success("¡Inscrito correctamente! Comienza a aprender.");
    } else {
      toast.error(result.error || "Error al inscribirse");
    }
  };

  const estaCompletada = (lessonId: string) => completadas.includes(lessonId);

  const handleToggleLesson = async () => {
    if (!selectedLesson) return;

    const yaEstaba = estaCompletada(selectedLesson.id);
    setGuardando(true);

    const resultado = await toggleLesson(selectedLesson.id, !yaEstaba);
    setGuardando(false);

    if (!resultado.success) {
      toast.error(resultado.error || "No se pudo guardar el progreso");
      return;
    }

    // Actualizamos la lista local y releemos el porcentaje del servidor
    setCompletadas((prev) =>
      yaEstaba
        ? prev.filter((id) => id !== selectedLesson.id)
        : [...prev, selectedLesson.id],
    );

    const resumen = resultado.data?.course;
    if (resumen?.percentage !== undefined) {
      setPorcentaje(resumen.percentage);
      if (resumen.percentage === 100) {
        toast.success("🎉 ¡Completaste el curso!");
        return;
      }
    }

    toast.success(yaEstaba ? "Lección desmarcada" : "Lección completada");
  };

  if (!course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <p className="text-gray-600">Cargando curso...</p>
        </div>
      </div>
    );
  }

  const totalLessons = course.modules?.reduce(
    (acc, m) => acc + (m.lessons?.length || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/courses" className="text-2xl font-bold text-gray-900">
            ← Volver a Cursos
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Course Header */}
            <div className="rounded-lg bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden">
              <img
                src={course.image}
                alt={course.title}
                className="h-96 w-full object-cover"
              />
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {course.title}
                  </h1>
                  <span className="rounded-full bg-blue-100 px-4 py-1 text-sm font-medium text-blue-800">
                    {course.category?.name}
                  </span>
                </div>
                <p className="mt-4 text-gray-600">{course.description}</p>
                <div className="mt-4 flex gap-4 text-sm text-gray-600">
                  <span>📚 {course.modules?.length || 0} módulos</span>
                  <span>📹 {totalLessons} lecciones</span>
                </div>
              </div>
            </div>

            {/* Video Player */}
            {selectedLesson?.video?.videoUrl && (
              <div className="mt-8 rounded-lg bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden">
                <div className="bg-black">
                  <iframe
                    width="100%"
                    height="500"
                    src={selectedLesson.video?.videoUrl}
                    title={selectedLesson.video?.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedLesson.title}
                  </h2>
                  <p className="mt-2 text-gray-600">
                    {selectedLesson.description}
                  </p>
                  {enrolled ? (
                    <button
                      onClick={handleToggleLesson}
                      disabled={guardando}
                      className={`mt-4 rounded-lg px-4 py-2 font-medium text-white disabled:opacity-60 ${
                        estaCompletada(selectedLesson.id)
                          ? "bg-gray-600 hover:bg-gray-700"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {guardando
                        ? "Guardando..."
                        : estaCompletada(selectedLesson.id)
                          ? "✓ Visto — desmarcar"
                          : "✓ Marcar como visto"}
                    </button>
                  ) : (
                    <p className="mt-4 text-sm text-gray-500">
                      Inscríbete al curso para registrar tu avance.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Enroll Card */}
            <div className="rounded-lg bg-white shadow-sm ring-1 ring-gray-200 p-6">
              {enrolled ? (
                <div>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900">Tu progreso</p>
                    <span className="text-sm font-medium text-gray-900">
                      {porcentaje}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-green-600 transition-all duration-300"
                      style={{ width: `${porcentaje}%` }}
                    ></div>
                  </div>
                  <p className="mt-3 text-sm text-gray-600">
                    {completadas.length} de {totalLessons} lecciones
                    completadas
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-gray-900">
                    ¡Empieza hoy!
                  </p>
                  <button
                    onClick={handleEnroll}
                    disabled={loading}
                    className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:bg-blue-400"
                  >
                    {loading ? "Inscribiendo..." : "Inscribirse al Curso"}
                  </button>
                </>
              )}
            </div>

            {/* Modules & Lessons */}
            <div className="rounded-lg bg-white shadow-sm ring-1 ring-gray-200 p-6">
              <h3 className="font-semibold text-gray-900">
                Contenido del Curso
              </h3>
              <div className="mt-4 space-y-4">
                {course.modules?.map((module) => (
                  <div key={module.id}>
                    <h4 className="font-medium text-gray-900">
                      {module.title}
                    </h4>
                    <div className="mt-2 space-y-2 pl-4">
                      {module.lessons?.map((lesson) => (
                        <button
                          key={lesson.id}
                          onClick={() => setSelectedLesson(lesson)}
                          className={`block w-full text-left text-sm p-2 rounded transition-colors ${
                            selectedLesson?.id === lesson.id
                              ? "bg-blue-100 text-blue-900 font-medium"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {estaCompletada(lesson.id) ? "✅" : "📹"}{" "}
                          {lesson.title}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
