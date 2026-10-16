// src/components/admin/CoursesTable.tsx
"use client";

import Link from "next/link";
import { Course } from "@/hooks/useCoursesAdminApi";

interface CoursesTableProps {
  courses: Course[];
  loading: boolean;
  onEdit: (course: Course) => void;
  onDelete: (id: string) => void;
}

const ESTADOS: Record<string, { label: string; clase: string }> = {
  published: { label: "Publicado", clase: "bg-[rgba(0,192,231,0.12)] text-[#00C0E7]" },
  draft:     { label: "Borrador",  clase: "bg-gray-800 text-gray-400" },
  preparing: { label: "Preparación", clase: "bg-[rgba(255,255,255,0.06)] text-gray-300" },
  archived:  { label: "Archivado", clase: "bg-[rgba(231,30,36,0.12)] text-[#E31E24]" },
};

export function CoursesTable({ courses, loading, onEdit, onDelete }: CoursesTableProps) {
  if (loading) {
    return (
      <div className="card-dark flex items-center justify-center py-16">
        <div className="spinner-cyan" />
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="card-dark p-12 text-center">
        <p className="text-gray-500 text-sm">No hay cursos. ¡Crea el primero!</p>
      </div>
    );
  }

  return (
    <div className="card-dark overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-800">
            <tr>
              <th className="th-brand">Curso</th>
              <th className="th-brand hidden md:table-cell">Categoría</th>
              <th className="th-brand">Estado</th>
              <th className="th-brand text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => {
              const estado = ESTADOS[course.status] ?? ESTADOS.draft;
              return (
                <tr key={course.id} className="border-b border-gray-800/60 hover:bg-[rgba(0,192,231,0.04)] transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-10 rounded-md overflow-hidden bg-gray-800 shrink-0">
                        {course.image ? (
                          <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium line-clamp-1">{course.title}</p>
                        <p className="text-gray-500 text-xs line-clamp-1">{course.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    {course.category?.name ? (
                      <span className="inline-block rounded-full border border-[rgba(0,192,231,0.3)] px-3 py-0.5 text-xs text-[#00C0E7]">
                        {course.category.name}
                      </span>
                    ) : (
                      <span className="text-gray-600 text-xs">Sin categoría</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-bold ${estado.clase}`}>
                      {estado.label}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/courses/${course.id}/content`}
                        className="rounded-lg bg-[rgba(0,192,231,0.12)] px-3 py-1.5 text-xs font-semibold text-[#00C0E7] hover:bg-[rgba(0,192,231,0.22)] transition-colors"
                      >
                        Contenido
                      </Link>
                      <button
                        onClick={() => onEdit(course)}
                        className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:border-[#00C0E7] hover:text-[#00C0E7] transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onDelete(course.id)}
                        className="rounded-lg border border-[rgba(231,30,36,0.4)] px-3 py-1.5 text-xs font-semibold text-[#E31E24] hover:bg-[rgba(231,30,36,0.1)] transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
