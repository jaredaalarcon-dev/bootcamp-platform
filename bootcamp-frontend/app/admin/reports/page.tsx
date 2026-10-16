// src/app/admin/reports/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useAdminApi, CourseReport, AdminStats } from "@/hooks/useAdminApi";

function BarChart({ items }: { items: { label: string; value: number; max: number; pct?: number }[] }) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-300 truncate max-w-[180px]">{item.label}</span>
            <span className="text-[#00C0E7] font-bold ml-2 shrink-0">
              {item.pct !== undefined ? `${item.pct}%` : item.value}
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-[#00C0E7] rounded-full transition-all duration-500"
              style={{ width: `${item.max > 0 ? Math.min((item.value / item.max) * 100, 100) : 0}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminReportsPage() {
  const { getReports, getStats, loading } = useAdminApi();
  const [reports, setReports] = useState<CourseReport[]>([]);
  const [stats,   setStats]   = useState<AdminStats | null>(null);

  useEffect(() => {
    Promise.all([getReports(), getStats()]).then(([r, s]) => {
      setReports(r);
      setStats(s);
    });
  }, []);

  const maxEnroll = Math.max(...reports.map((r) => r.enrollments), 1);

  const statusColor = (s: string) =>
    s === "published" ? "bg-[rgba(0,192,231,0.1)] text-[#00C0E7]" :
    s === "draft" ? "bg-gray-800 text-gray-400" :
    "bg-[rgba(231,30,36,0.1)] text-[#E31E24]";

  const statusLabel = (s: string) =>
    s === "published" ? "Publicado" : s === "draft" ? "Borrador" : s;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-brand text-[#00C0E7] text-2xl uppercase tracking-wide">Reportes y Métricas</h1>
        <p className="text-gray-500 text-sm mt-1">Análisis de inscripciones y progreso de la plataforma</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { v: stats?.totalEnrollments ?? 0,  l: "Total inscripciones" },
          { v: stats?.completedEnrollments ?? 0, l: "Cursos completados" },
          { v: `${stats?.completionRate ?? 0}%`, l: "Tasa de completado" },
          { v: stats?.totalStudents ?? 0, l: "Estudiantes activos" },
        ].map((kpi, i) => (
          <div key={i} className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-xl p-4 text-center">
            <p className="font-brand text-[#00C0E7] text-2xl">{loading ? "..." : kpi.v}</p>
            <p className="text-gray-500 text-xs mt-1">{kpi.l}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Inscripciones por curso */}
        <div className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-xl p-5">
          <h3 className="font-brand text-[#00C0E7] text-sm uppercase tracking-wide mb-5">Inscripciones por Curso</h3>
          {loading ? <div className="flex justify-center py-8"><div className="spinner-cyan" /></div> :
            <BarChart items={reports.map((r) => ({ label: r.title, value: r.enrollments, max: maxEnroll }))} />}
        </div>

        {/* Tasa de completado */}
        <div className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-xl p-5">
          <h3 className="font-brand text-[#00C0E7] text-sm uppercase tracking-wide mb-5">Tasa de Completado por Curso</h3>
          {loading ? <div className="flex justify-center py-8"><div className="spinner-cyan" /></div> :
            <BarChart items={reports.map((r) => ({ label: r.title, value: r.completionRate, max: 100, pct: r.completionRate }))} />}
        </div>
      </div>

      {/* Tabla detalle */}
      <div className="bg-[#111827] border border-[rgba(0,192,231,0.15)] rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-800">
          <h3 className="font-brand text-[#00C0E7] text-sm uppercase tracking-wide">Detalle por Curso</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-[#00C0E7] font-brand text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3">Curso</th>
                <th className="text-left px-5 py-3 hidden sm:table-cell">Categoría</th>
                <th className="text-center px-5 py-3">Estado</th>
                <th className="text-center px-5 py-3">Inscritos</th>
                <th className="text-center px-5 py-3">Completados</th>
                <th className="text-center px-5 py-3">Tasa</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center"><div className="spinner-cyan mx-auto" /></td></tr>
              ) : reports.map((r) => (
                <tr key={r.id} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                  <td className="px-5 py-3 text-white font-medium">{r.title}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs hidden sm:table-cell">{r.category}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColor(r.status)}`}>{statusLabel(r.status)}</span>
                  </td>
                  <td className="px-5 py-3 text-center text-[#00C0E7] font-bold">{r.enrollments}</td>
                  <td className="px-5 py-3 text-center text-gray-400">{r.completions}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`font-bold text-sm ${r.completionRate >= 70 ? "text-[#00C0E7]" : r.completionRate >= 30 ? "text-white" : "text-gray-500"}`}>
                      {r.completionRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
