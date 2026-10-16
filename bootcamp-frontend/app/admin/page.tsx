// src/app/admin/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminApi, AdminStats } from "@/hooks/useAdminApi";

function StatCard({ value, label, icon, color }: { value: string | number; label: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
      <div>
        <p className="font-brand text-[#00C0E7] text-3xl leading-none">{value}</p>
        <p className="text-gray-400 text-xs mt-1">{label}</p>
      </div>
    </div>
  );
}

const CARDS = [
  { title: "Gestionar Cursos", desc: "Crea, edita, publica o elimina cursos del catálogo.", href: "/admin/courses", icon: "📚", active: true },
  { title: "Gestionar Categorías", desc: "Organiza las categorías de la plataforma.", href: "/admin/categories", icon: "🏷️", active: true },
  { title: "Usuarios y Roles", desc: "Administra permisos y roles de los estudiantes.", href: "/admin/users", icon: "👥", active: true },
  { title: "Reportes y Métricas", desc: "Visualiza inscripciones y avance de alumnos.", href: "/admin/reports", icon: "📊", active: true },
  { title: "Configuración", desc: "Ajustes y variables del sistema.", href: "/admin/settings", icon: "⚙️", active: true },
  { title: "Ver Plataforma", desc: "Regresa a la vista principal de estudiante.", href: "/dashboard", icon: "🎓", active: true },
];

export default function AdminDashboardPage() {
  const { getStats, loading } = useAdminApi();
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => { getStats().then(setStats); }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-brand text-[#00C0E7] text-2xl uppercase tracking-wide">Panel de Administración</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen general de la plataforma de cursos de Soluciones Integrales JB</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard value={loading ? "..." : stats?.totalCourses ?? 0} label="Cursos" color="bg-[rgba(0,192,231,0.1)] text-[#00C0E7]"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>} />
        <StatCard value={loading ? "..." : stats?.totalStudents ?? 0} label="Estudiantes" color="bg-[rgba(231,30,36,0.1)] text-[#E31E24]"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
        <StatCard value={loading ? "..." : stats?.totalEnrollments ?? 0} label="Inscripciones" color="bg-[rgba(0,192,231,0.1)] text-[#00C0E7]"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} />
        <StatCard value={loading ? "..." : `${stats?.completionRate ?? 0}%`} label="Tasa de completado" color="bg-[rgba(231,30,36,0.1)] text-[#E31E24]"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>} />
      </div>

      {/* Top cursos */}
      {stats?.topCourses && stats.topCourses.length > 0 && (
        <div className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-xl p-5">
          <h3 className="font-brand text-[#00C0E7] text-sm uppercase tracking-wide mb-4">Top Cursos por Inscripciones</h3>
          <div className="space-y-3">
            {stats.topCourses.map((c, i) => (
              <div key={c.courseId} className="flex items-center gap-3">
                <span className="font-brand text-[#E31E24] text-lg w-5 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{c.title}</p>
                  <div className="mt-1 h-1.5 bg-gray-700 rounded-full">
                    <div className="h-full bg-[#00C0E7] rounded-full"
                      style={{ width: `${Math.min((c.enrollments / (stats.topCourses[0]?.enrollments || 1)) * 100, 100)}%` }} />
                  </div>
                </div>
                <span className="text-[#00C0E7] font-bold text-sm shrink-0">{c.enrollments}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cards de acceso rápido */}
      <div>
        <h3 className="font-brand text-[#00C0E7] text-sm uppercase tracking-wide mb-4">Acceso Rápido</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((card) => (
            <Link key={card.href} href={card.href}>
              <div className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-xl p-5 hover:border-[#00C0E7]/50 transition-colors cursor-pointer group">
                <div className="text-2xl mb-3">{card.icon}</div>
                <h4 className="text-white font-semibold text-sm group-hover:text-[#00C0E7] transition-colors">{card.title}</h4>
                <p className="text-gray-500 text-xs mt-1">{card.desc}</p>
                <p className="mt-3 text-[#00C0E7] text-xs font-semibold">Ingresar →</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
