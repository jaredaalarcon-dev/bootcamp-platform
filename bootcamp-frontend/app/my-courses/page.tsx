// src/app/my-courses/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProgressApi, MyCourse } from "@/hooks/useProgressApi";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export default function MyCoursesPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { getMyCourses, loading } = useProgressApi();
  const [enrollments, setEnrollments] = useState<MyCourse[]>([]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    loadEnrollments();
  }, []);

  const loadEnrollments = async () => {
    const result = await getMyCourses();
    if (result.success && result.data) {
      setEnrollments(result.data);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="text-2xl font-bold text-gray-900"
            >
              Bootcamp
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/courses"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Explorar Cursos
              </Link>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mis Cursos</h1>
          <p className="mt-2 text-gray-600">
            Continúa aprendiendo donde lo dejaste
          </p>
        </div>

        {/* Cursos */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
              <p className="text-gray-600">Cargando tus cursos...</p>
            </div>
          </div>
        ) : enrollments.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((enrollment) => (
              <Link
                key={enrollment.enrollmentId}
                href={`/courses/${enrollment.course.id}`}
              >
                <div className="overflow-hidden rounded-lg bg-white shadow-md transition-transform duration-300 hover:shadow-lg hover:scale-105 cursor-pointer">
                  {/* Image */}
                  <div className="relative h-48 w-full overflow-hidden bg-gray-200">
                    <img
                      src={enrollment.course.image}
                      alt={enrollment.course.title}
                      className="h-full w-full object-cover"
                    />
                    <div
                      className={`absolute right-2 top-2 rounded-full px-3 py-1 text-xs font-medium text-white ${
                        enrollment.progress.percentage === 100
                          ? "bg-purple-600"
                          : "bg-green-600"
                      }`}
                    >
                      {enrollment.progress.percentage === 100
                        ? "Completado"
                        : "En Progreso"}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {enrollment.course.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {enrollment.course.description}
                    </p>

                    {/* Progress */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Progreso</span>
                        <span>{enrollment.progress.percentage}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-600"
                          style={{
                            width: `${enrollment.progress.percentage}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 flex items-center justify-between">
                      <button className="inline-block text-sm font-medium text-blue-600 hover:text-blue-700">
                        Continuar →
                      </button>
                      <div className="text-xs text-gray-500">
                        {enrollment.progress.completedLessons} de{" "}
                        {enrollment.progress.totalLessons} lecciones
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-lg bg-white p-12 shadow-sm ring-1 ring-gray-200">
            <div className="text-center">
              <p className="text-gray-600">
                Aún no estás inscrito en ningún curso
              </p>
              <Link
                href="/courses"
                className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Explorar cursos disponibles →
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
