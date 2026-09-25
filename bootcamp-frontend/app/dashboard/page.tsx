// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useProgressApi, ProgressSummary, MyCourse } from "@/hooks/useProgressApi";
import { StudentLayout } from "@/components/ui/StudentLayout";
import Link from "next/link";

function StatusBadge({ pct }: { pct: number }) {
  if (pct === 100) return <span className="absolute top-2 left-2 bg-[#00C0E7] text-[#0d0d0d] text-xs font-bold px-2 py-0.5 rounded-full">Completado</span>;
  if (pct > 0)    return <span className="absolute top-2 left-2 bg-[#E31E24] text-white text-xs font-bold px-2 py-0.5 rounded-full">En progreso</span>;
  return              <span className="absolute top-2 left-2 bg-gray-700 text-gray-300 text-xs font-bold px-2 py-0.5 rounded-full">Pendiente</span>;
}

export default function DashboardPage() {
  const router = useRouter();
  const { getUser, getToken } = useAuth();
  const { getSummary, getMyCourses } = useProgressApi();
  const [user,    setUser]    = useState<any>(null);
  const [resumen, setResumen] = useState<ProgressSummary | null>(null);
  const [cursos,  setCursos]  = useState<MyCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    const u = getUser();
    setUser(u);
    Promise.all([getSummary(), getMyCourses()]).then(([s, c]) => {
      if (s.success && s.data) setResumen(s.data);
      if (c.success && c.data) setCursos(c.data);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#0d0d0d]">
      <div className="spinner-cyan" />
    </div>
  );

  const nombre = user?.firstName ?? user?.email?.split("@")[0] ?? "Estudiante";
  const recientes = cursos.slice(0, 3);

  const StatCard = ({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) => (
    <div className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-xl p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-[rgba(0,192,231,0.1)] border border-[rgba(0,192,231,0.2)] flex items-center justify-center text-[#00C0E7]">
        {icon}
      </div>
      <div>
        <p className="font-brand text-[#00C0E7] text-3xl leading-none">{value}</p>
        <p className="text-gray-400 text-xs mt-1">{label}</p>
      </div>
    </div>
  );

  return (
    <StudentLayout
      topbar={
        <div className="relative flex-1 max-w-sm hidden sm:block">
          <input
            type="text"
            placeholder="Buscar cursos..."
            className="w-full bg-[#0d0d0d] border border-[rgba(0,192,231,0.2)] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C0E7]"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      }
    >
      <div className="p-6 space-y-6">

        {/* Hero banner */}
        <div
          className="rounded-2xl overflow-hidden relative min-h-[140px] flex items-center"
          style={{
            background: "linear-gradient(120deg, #0f2a3f 0%, #0d1b2e 50%, #1a0d1f 100%)",
            backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop&q=60')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0d]/90 via-[#0d0d0d]/60 to-[#0d0d0d]/30" />
          <div className="relative z-10 flex items-center justify-between w-full px-8 py-6">
            <div>
              <h2 className="font-brand text-[#00C0E7] text-3xl uppercase tracking-wide">
                ¡Hola, {nombre}!
              </h2>
              <p className="text-gray-300 text-sm mt-1">
                Sigue aprendiendo, cada paso te acerca a tus metas.
              </p>
              <div className="mt-3 h-[2px] w-16 bg-[#E31E24] rounded" />
            </div>
            <div className="hidden md:block text-right max-w-xs">
              <p className="text-white/80 text-sm italic leading-relaxed">
                "La educación es la clave para un mejor futuro."
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
            value={resumen?.enrolledCourses ?? 0}
            label="Cursos inscritos"
          />
          <StatCard
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
            value={`${resumen?.overallPercentage ?? 0}%`}
            label="Progreso general"
          />
          <StatCard
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>}
            value={resumen?.completedCourses ?? 0}
            label="Certificados obtenidos"
          />
        </div>

        {/* Mis cursos */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-brand text-white text-xl uppercase tracking-wide">Mis Cursos</h3>
            <Link href="/my-courses" className="text-[#00C0E7] text-sm font-semibold hover:underline flex items-center gap-1">
              Ver todos →
            </Link>
          </div>

          {recientes.length === 0 ? (
            <div className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-xl p-12 text-center">
              <p className="text-gray-500 text-sm">Aún no estás inscrito en ningún curso.</p>
              <Link href="/courses" className="btn-red inline-block mt-4 text-sm">Explorar cursos</Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recientes.map((e) => {
                const pct = e.progress.percentage;
                const enProgreso = pct > 0 && pct < 100;
                const completado = pct === 100;
                return (
                  <div key={e.enrollmentId} className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-xl overflow-hidden flex flex-col hover:border-[#00C0E7]/40 transition-colors">
                    {/* Imagen */}
                    <div className="relative h-40 bg-gray-800 overflow-hidden">
                      {e.course.image ? (
                        <img src={e.course.image} alt={e.course.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full flex items-center justify-center bg-gray-900">
                          <svg className="w-12 h-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.361a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/80 to-transparent" />
                      <StatusBadge pct={pct} />
                    </div>

                    {/* Contenido */}
                    <div className="p-4 flex flex-col flex-1">
                      <h4 className="text-white font-semibold text-sm line-clamp-2 leading-snug">
                        {e.course.title}
                      </h4>
                      <p className="text-gray-500 text-xs mt-1 line-clamp-2">{e.course.description}</p>

                      {/* Barra de progreso */}
                      <div className="mt-3">
                        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#00C0E7] rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-right text-xs text-[#00C0E7] font-bold mt-0.5">{pct}%</p>
                      </div>

                      {/* Botón */}
                      <div className="mt-3">
                        <Link href={`/courses/${e.course.id}`}>
                          {completado ? (
                            <button className="w-full btn-cyan text-sm py-2">Ver certificado</button>
                          ) : enProgreso ? (
                            <button className="w-full btn-red text-sm py-2">Continuar</button>
                          ) : (
                            <button className="w-full btn-cyan text-sm py-2">Comenzar</button>
                          )}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
