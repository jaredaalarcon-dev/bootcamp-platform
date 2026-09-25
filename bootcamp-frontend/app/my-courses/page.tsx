// src/app/my-courses/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProgressApi, MyCourse } from "@/hooks/useProgressApi";
import { useAuth } from "@/hooks/useAuth";
import { StudentLayout } from "@/components/ui/StudentLayout";
import Link from "next/link";

export default function MyCoursesPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { getMyCourses, loading } = useProgressApi();
  const [enrollments, setEnrollments] = useState<MyCourse[]>([]);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    getMyCourses().then((r) => { if (r.success && r.data) setEnrollments(r.data); });
  }, []);

  return (
    <StudentLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-brand text-[#00C0E7] text-2xl uppercase tracking-wide">Mis Cursos</h1>
            <p className="text-gray-500 text-sm mt-1">Continúa aprendiendo donde lo dejaste</p>
          </div>
          <Link href="/courses" className="btn-red text-sm py-2 px-4">+ Explorar más</Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="spinner-cyan" /></div>
        ) : enrollments.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {enrollments.map((e) => {
              const pct = e.progress.percentage;
              return (
                <Link key={e.enrollmentId} href={`/courses/${e.course.id}`}>
                  <div className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-xl overflow-hidden hover:border-[#00C0E7]/50 transition-colors cursor-pointer group">
                    <div className="relative h-44 bg-gray-800 overflow-hidden">
                      {e.course.image ? (
                        <img src={e.course.image} alt={e.course.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="h-full bg-gray-900 flex items-center justify-center">
                          <svg className="w-12 h-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/80 to-transparent" />
                      <span className={`absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full ${pct === 100 ? "bg-[#00C0E7] text-[#0d0d0d]" : pct > 0 ? "bg-[#E31E24] text-white" : "bg-gray-700 text-gray-300"}`}>
                        {pct === 100 ? "✓ Completado" : pct > 0 ? "En progreso" : "Pendiente"}
                      </span>
                    </div>
                    <div className="p-4">
                      {e.course.category?.name && (
                        <p className="text-[#00C0E7] text-xs font-bold uppercase tracking-wide mb-1">{e.course.category.name}</p>
                      )}
                      <h3 className="text-white font-semibold text-sm line-clamp-2 group-hover:text-[#00C0E7] transition-colors">{e.course.title}</h3>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">Progreso</span>
                          <span className="text-[#00C0E7] font-bold">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-700 rounded-full">
                          <div className="h-full bg-[#00C0E7] rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{e.progress.completedLessons} de {e.progress.totalLessons} lecciones</p>
                      </div>
                      <p className="mt-3 text-sm font-semibold text-[#00C0E7]">
                        {pct === 100 ? "Ver certificado →" : pct > 0 ? "Continuar →" : "Comenzar →"}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-xl p-16 text-center">
            <svg className="w-12 h-12 text-gray-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            <p className="text-gray-500 text-sm">Aún no estás inscrito en ningún curso.</p>
            <Link href="/courses" className="btn-red inline-block mt-4 text-sm">Explorar Cursos</Link>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
