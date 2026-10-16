// src/app/certificates/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useProgressApi, MyCourse } from "@/hooks/useProgressApi";
import { StudentLayout } from "@/components/ui/StudentLayout";

const IconMedalla = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const IconCandado = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

export default function CertificatesPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { getMyCourses } = useProgressApi();
  const [cursos, setCursos] = useState<MyCourse[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    getMyCourses().then((r) => {
      if (r.success && r.data) setCursos(r.data);
      setCargando(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const obtenidos = cursos.filter((c) => c.progress.percentage === 100);
  const pendientes = cursos
    .filter((c) => c.progress.percentage < 100)
    .sort((a, b) => b.progress.percentage - a.progress.percentage);

  return (
    <StudentLayout>
      <div className="p-6 space-y-8 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="font-brand text-[#00C0E7] text-2xl uppercase tracking-wide">Mis Certificados</h1>
            <p className="text-gray-500 text-sm mt-1">Completa el 100% de un curso para desbloquear su certificado</p>
          </div>
          {!cargando && cursos.length > 0 && (
            <p className="text-sm text-gray-400">
              <span className="font-brand text-[#00C0E7] text-xl">{obtenidos.length}</span> de {cursos.length} obtenidos
            </p>
          )}
        </div>

        {cargando ? (
          <div className="flex justify-center py-20"><div className="spinner-cyan" /></div>
        ) : cursos.length === 0 ? (
          <div className="card-dark p-14 text-center">
            <IconMedalla className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Inscríbete en un curso para empezar a ganar certificados.</p>
            <Link href="/courses" className="btn-red inline-block mt-4 text-sm">Explorar cursos</Link>
          </div>
        ) : (
          <>
            {/* ── Obtenidos ───────────────────────────────────────────── */}
            <section>
              <h2 className="font-brand text-white text-lg uppercase tracking-wide mb-1">Obtenidos</h2>
              <div className="h-[2px] w-10 bg-[#E31E24] rounded mb-4" />

              {obtenidos.length === 0 ? (
                <div className="card-dark p-8 text-center">
                  <p className="text-gray-500 text-sm">
                    Aún no tienes certificados. ¡Termina tu primer curso para conseguirlo!
                  </p>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {obtenidos.map((e) => (
                    <div
                      key={e.enrollmentId}
                      className="rounded-xl overflow-hidden bg-[#111827] border border-[#00C0E7]/40 shadow-[0_0_30px_rgba(0,192,231,0.08)] flex flex-col"
                    >
                      {/* Mini certificado */}
                      <div className="keep-theme relative bg-gradient-to-br from-[#0f2a3f] to-[#111827] px-5 pt-5 pb-6 text-center">
                        <div className="absolute top-0 inset-x-0 h-1 bg-[#00C0E7]" />
                        <div className="w-14 h-14 mx-auto rounded-full border-2 border-[#00C0E7] flex items-center justify-center text-[#00C0E7] shadow-[0_0_20px_rgba(0,192,231,0.3)]">
                          <IconMedalla className="w-7 h-7" />
                        </div>
                        <p className="text-gray-400 text-[10px] uppercase tracking-widest mt-3">Certificado de finalización</p>
                        <h3 className="font-brand text-[#00C0E7] text-base uppercase tracking-wide mt-1 line-clamp-2">
                          {e.course.title}
                        </h3>
                        <div className="absolute bottom-0 inset-x-0 h-1 bg-[#E31E24]" />
                      </div>

                      <div className="p-4 flex flex-col flex-1">
                        {e.course.category?.name && (
                          <p className="text-[#00C0E7] text-xs font-bold uppercase tracking-wide">{e.course.category.name}</p>
                        )}
                        <p className="text-gray-500 text-xs mt-1">{e.progress.totalLessons} lecciones completadas</p>
                        <div className="flex-1" />
                        <Link
                          href={`/certificates/${e.course.id}`}
                          className="btn-red text-sm py-2 mt-4 flex items-center justify-center gap-2"
                        >
                          Ver y descargar
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── Por desbloquear ─────────────────────────────────────── */}
            {pendientes.length > 0 && (
              <section>
                <h2 className="font-brand text-white text-lg uppercase tracking-wide mb-1">Por desbloquear</h2>
                <div className="h-[2px] w-10 bg-[#E31E24] rounded mb-4" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {pendientes.map((e) => {
                    const pct = e.progress.percentage;
                    const faltan = e.progress.totalLessons - e.progress.completedLessons;
                    return (
                      <div key={e.enrollmentId} className="card-dark p-4 flex flex-col">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-500 shrink-0">
                            <IconCandado />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-white text-sm font-semibold line-clamp-2">{e.course.title}</h3>
                            <p className="text-gray-500 text-xs mt-0.5">
                              {faltan > 0 ? `Te faltan ${faltan} lecciones` : "Este curso aún no tiene lecciones"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                          <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-[#00C0E7] rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[#00C0E7] text-xs font-bold">{pct}%</span>
                        </div>
                        <Link
                          href={`/courses/${e.course.id}`}
                          className="mt-4 text-sm font-semibold text-[#00C0E7] hover:underline"
                        >
                          {pct > 0 ? "Continuar curso →" : "Comenzar curso →"}
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </StudentLayout>
  );
}
