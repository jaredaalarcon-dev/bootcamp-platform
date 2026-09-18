// src/app/courses/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCoursesApi } from "@/hooks/useCoursesApi";
import { useAuth } from "@/hooks/useAuth";
import { CourseCard } from "@/components/courses/CourseCard";
import Link from "next/link";

interface Course {
  id: string;
  title: string;
  description: string;
  image: string;
  category: {
    name: string;
  };
}

export default function CoursesPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { getCourses, loading } = useCoursesApi();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    // Verificar que esté logueado
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    loadCourses();
  }, []);

  const loadCourses = async () => {
    const result = await getCourses();
    if (result.success && result.data) {
      setCourses(result.data);
      setFilteredCourses(result.data);

      // Obtener categorías únicas
      const uniqueCategories = Array.from(
        new Set(
          result.data
            .map((c: Course) => c.category?.name)
            .filter((nombre: string | undefined): nombre is string =>
              Boolean(nombre),
            ),
        ),
      ) as string[];
      setCategories(uniqueCategories);
    }
  };

  // Filtrar cursos
  useEffect(() => {
    let filtered = courses;

    // Por categoría
    if (selectedCategory !== "all") {
      filtered = filtered.filter((c) => c.category.name === selectedCategory);
    }

    // Por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.description.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredCourses(filtered);
  }, [searchTerm, selectedCategory, courses]);

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
                href="/my-courses"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Mis Cursos
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
          <h1 className="text-3xl font-bold text-gray-900">Nuestros Cursos</h1>
          <p className="mt-2 text-gray-600">
            Elige un curso y comienza tu viaje de aprendizaje
          </p>
        </div>

        {/* Filtros */}
        <div className="mb-8 space-y-4 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
          {/* Búsqueda */}
          <input
            type="text"
            placeholder="Buscar cursos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Categorías */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-900 hover:bg-gray-300"
              }`}
            >
              Todos
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de Cursos */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
              <p className="text-gray-600">Cargando cursos...</p>
            </div>
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-lg bg-white p-12 shadow-sm ring-1 ring-gray-200">
            <div className="text-center">
              <p className="text-gray-600">
                No se encontraron cursos con los filtros seleccionados
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
