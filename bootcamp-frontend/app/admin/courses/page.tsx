// src/app/admin/courses/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  useCoursesAdminApi,
  Course,
  Category,
} from "@/hooks/useCoursesAdminApi";
import { CourseForm } from "@/components/admin/CourseForm";
import { CoursesTable } from "@/components/admin/CoursesTable";
import Link from "next/link";
import toast from "react-hot-toast";

export default function AdminCoursesPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { getCourses, getCategories, deleteCourse } = useCoursesAdminApi();

  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const coursesResult = await getCourses();
    const categoriesResult = await getCategories();

    if (coursesResult.success) {
      setCourses(coursesResult.data);
    }
    if (categoriesResult.success) {
      setCategories(categoriesResult.data);
    }

    setLoading(false);
  };

  const handleEdit = (course: Course) => {
    setSelectedCourse(course);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este curso?")) {
      return;
    }

    const result = await deleteCourse(id);
    if (result.success) {
      toast.success("Curso eliminado exitosamente");
      loadData();
    } else {
      toast.error(result.error || "Error al eliminar el curso");
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedCourse(null);
    loadData();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedCourse(null);
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
            <div className="text-sm font-medium text-gray-600">
              Panel de Administración
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gestionar Cursos
            </h1>
            <p className="mt-2 text-gray-600">Crea, edita y elimina cursos</p>
          </div>
          <button
            onClick={() => {
              setSelectedCourse(null);
              setShowForm(!showForm);
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            {showForm ? "Cancelar" : "+ Nuevo Curso"}
          </button>
        </div>

        {/* Form Section */}
        {showForm && (
          <div className="mb-8 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              {selectedCourse ? "Editar Curso" : "Crear Nuevo Curso"}
            </h2>
            <CourseForm
              course={selectedCourse}
              categories={categories}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        )}

        {/* Table Section */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Todos los Cursos ({courses.length})
          </h2>
          <CoursesTable
            courses={courses}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </main>
    </div>
  );
}
