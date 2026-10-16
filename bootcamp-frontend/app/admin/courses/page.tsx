// src/app/admin/courses/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useCoursesAdminApi, Course, Category } from "@/hooks/useCoursesAdminApi";
import { CourseForm } from "@/components/admin/CourseForm";
import { CoursesTable } from "@/components/admin/CoursesTable";
import toast from "react-hot-toast";

export default function AdminCoursesPage() {
  const { getCourses, getCategories, deleteCourse } = useCoursesAdminApi();

  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [coursesResult, categoriesResult] = await Promise.all([
      getCourses(),
      getCategories(),
    ]);
    if (coursesResult.success) setCourses(coursesResult.data ?? []);
    if (categoriesResult.success) setCategories(categoriesResult.data ?? []);
    setLoading(false);
  };

  const handleEdit = (course: Course) => {
    setSelectedCourse(course);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este curso? Se borrarán también sus módulos y lecciones.")) return;
    const result = await deleteCourse(id);
    if (result.success) {
      toast.success("Curso eliminado");
      loadData();
    } else {
      toast.error(result.error || "Error al eliminar el curso");
    }
  };

  const cerrarFormulario = () => {
    setShowForm(false);
    setSelectedCourse(null);
  };

  const filtrados = courses.filter((c) =>
    !search ||
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const publicados = courses.filter((c) => c.status === "published").length;

  return (
    <div className="p-6 space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-brand text-[#00C0E7] text-2xl uppercase tracking-wide">
            Gestionar Cursos
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {courses.length} cursos · {publicados} publicados
          </p>
        </div>
        <button
          onClick={() => (showForm ? cerrarFormulario() : setShowForm(true))}
          className={showForm ? "btn-cyan text-sm py-2" : "btn-red text-sm py-2"}
        >
          {showForm ? "Cancelar" : "+ Nuevo Curso"}
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="card-dark p-6">
          <h2 className="text-white font-semibold text-lg mb-1">
            {selectedCourse ? "Editar curso" : "Crear nuevo curso"}
          </h2>
          <div className="h-[2px] w-12 bg-[#E31E24] rounded mb-5" />
          <CourseForm
            course={selectedCourse}
            categories={categories}
            onSuccess={() => { cerrarFormulario(); loadData(); }}
            onCancel={cerrarFormulario}
          />
        </div>
      )}

      {/* Buscador */}
      <div className="card-dark p-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título o categoría..."
          className="input-dark"
        />
      </div>

      {/* Tabla */}
      <CoursesTable
        courses={filtrados}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
