"use client";

import Link from "next/link";
import { Course } from "@/hooks/useCoursesAdminApi";

interface CoursesTableProps {
  courses: Course[];
  loading: boolean;
  onEdit: (course: Course) => void;
  onDelete: (id: string) => void;
}

export function CoursesTable({
  courses,
  loading,
  onEdit,
  onDelete,
}: CoursesTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <p className="text-gray-600">Cargando cursos...</p>
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg bg-white p-12 shadow-sm ring-1 ring-gray-200">
        <p className="text-gray-600">No hay cursos. ¡Crea el primero!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-gray-200">
      <table className="w-full">
        {/* Header */}
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
              Título
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
              Categoría
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
              Acciones
            </th>
          </tr>
        </thead>

        {/* Body */}
        <tbody className="divide-y divide-gray-200">
          {courses.map((course) => (
            <tr key={course.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div>
                  <p className="font-medium text-gray-900">{course.title}</p>
                  <p className="text-xs text-gray-600">
                    {course.description.substring(0, 50)}...
                  </p>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                  {course.category.name}
                </span>
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                    course.status === "published"
                      ? "bg-green-100 text-green-800"
                      : course.status === "draft"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {course.status === "published"
                    ? "Publicado"
                    : course.status === "draft"
                      ? "Borrador"
                      : course.status === "preparing"
                        ? "Preparación"
                        : "Archivado"}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/admin/courses/${course.id}/content`}
                    className="text-sm font-medium text-purple-600 hover:text-purple-700"
                  >
                    Contenido
                  </Link>
                  <button
                    onClick={() => onEdit(course)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(course.id)}
                    className="text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
