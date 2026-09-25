// src/app/courses/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCoursesApi } from "@/hooks/useCoursesApi";
import { useAuth } from "@/hooks/useAuth";
import { StudentLayout } from "@/components/ui/StudentLayout";
import Link from "next/link";

interface Course { id: string; title: string; description: string; image: string; category?: { name: string }; }

export default function CoursesPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { getCourses, loading } = useCoursesApi();
  const [courses,         setCourses]         = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchTerm,      setSearchTerm]      = useState("");
  const [selectedCat,     setSelectedCat]     = useState("all");
  const [categories,      setCategories]      = useState<string[]>([]);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    getCourses().then((r) => {
      if (r.success && r.data) {
        setCourses(r.data);
        setFilteredCourses(r.data);
        setCategories(Array.from(new Set(r.data.map((c: Course) => c.category?.name).filter(Boolean))) as string[]);
      }
    });
  }, []);

  useEffect(() => {
    let f = courses;
    if (selectedCat !== "all") f = f.filter((c) => c.category?.name === selectedCat);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      f = f.filter((c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }
    setFilteredCourses(f);
  }, [searchTerm, selectedCat, courses]);

  return (
    <StudentLayout
      topbar={
        <div className="relative flex-1 max-w-sm hidden sm:block">
          <input
            type="text"
            placeholder="Buscar cursos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0d0d0d] border border-[rgba(0,192,231,0.2)] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C0E7]"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      }
    >
      <div className="p-6">
        <div className="mb-6">
          <h1 className="font-brand text-[#00C0E7] text-2xl uppercase tracking-wide">Explorar Cursos</h1>
          <p className="text-gray-500 text-sm mt-1">Elige un curso y comienza tu viaje de aprendizaje</p>
        </div>

        {/* Filtros por categoría */}
        <div className="flex flex-wrap gap-2 mb-6">
          {["all", ...categories].map((cat) => (
            <button key={cat} onClick={() => setSelectedCat(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${selectedCat === cat ? "bg-[#00C0E7] text-[#0d0d0d]" : "border border-[rgba(0,192,231,0.3)] text-gray-400 hover:border-[#00C0E7] hover:text-[#00C0E7]"}`}>
              {cat === "all" ? "Todos" : cat}
            </button>
          ))}
        </div>

        {/* Búsqueda mobile */}
        <div className="relative mb-5 sm:hidden">
          <input type="text" placeholder="Buscar cursos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#111827] border border-[rgba(0,192,231,0.2)] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C0E7]" />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="spinner-cyan" /></div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredCourses.map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`}>
                <div className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-xl overflow-hidden hover:border-[#00C0E7]/50 transition-colors cursor-pointer group">
                  <div className="relative h-44 bg-gray-800 overflow-hidden">
                    {course.image ? (
                      <img src={course.image} alt={course.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="h-full bg-gray-900 flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                    )}
                    {course.category?.name && (
                      <span className="absolute top-2 left-2 bg-[#00C0E7] text-[#0d0d0d] text-xs font-bold px-2 py-0.5 rounded">{course.category.name}</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-semibold text-sm line-clamp-2 group-hover:text-[#00C0E7] transition-colors">{course.title}</h3>
                    <p className="text-gray-500 text-xs mt-1 line-clamp-2">{course.description}</p>
                    <p className="mt-3 text-sm font-semibold text-[#00C0E7]">Ver curso →</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-xl p-12 text-center">
            <p className="text-gray-500 text-sm">No se encontraron cursos.</p>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
