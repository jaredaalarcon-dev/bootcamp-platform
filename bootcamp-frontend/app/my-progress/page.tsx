// src/app/my-progress/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useProgressApi, ProgressSummary, MyCourse } from "@/hooks/useProgressApi";
import { useCoursesApi } from "@/hooks/useCoursesApi";
import { StudentLayout } from "@/components/ui/StudentLayout";

interface LessonLite { id: string; title: string; orderNumber: number; }
interface ModuleLite { id: string; title: string; orderNumber: number; lessons: LessonLite[]; }

type Filtro = "todos" | "progreso" | "pendientes" | "completados";

// ── Anillo de progreso general ────────────────────────────────────────────
function AnilloProgreso({ pct }: { pct: number }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-36 h-36 shrink-0">
      <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#1f2937" strokeWidth="12" />
        <circle
          cx="64" cy="64" r={r} fill="none" stroke="#00C0E7" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-brand text-[#00C0E7] text-3xl leading-none">{pct}%</span>
        <span className="text-gray-500 text-[11px] mt-1 uppercase tracking-wider">General</span>
      </div>
    </div>
  );
}

function estado(pct: number) {
  if (pct === 100) return { label: "Completado", clase: "bg-[#00C0E7] text-[#0d0d0d]" };
  if (pct > 0) return { label: "En progreso", clase: "bg-[#E31E24] text-white" };
  return { label: "Pendiente", clase: "bg-gray-700 text-gray-300" };
}

// ── Detalle por módulo (se carga al expandir) ─────────────────────────────
function DetalleModulos({ courseId }: { courseId: string }) {
  const { getCourseById } = useCoursesApi();
  const { getCourseProgress } = useProgressApi();
  const [modulos, setModulos] = useState<ModuleLite[] | null>(null);
  const [hechas, setHechas] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([getCourseById(courseId), getCourseProgress(courseId)]).then(([c, p]) => {
      setModulos(c?.success && c.data?.modules ? c.data.modules : []);
      if (p.success && p.data) setHechas(p.data.completedLessonIds || []);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  if (!modulos) return <div className="py-6 flex justify-center"><div className="spinner-cyan" /></div>;
  if (modulos.length === 0) return <p className="py-4 text-sm text-gray-500">Este curso aún no tiene módulos.</p>;

  return (
    <div className="space-y-3 pt-4">
      {modulos.map((m) => {
        const total = m.lessons?.length || 0;
        const ok = (m.lessons || []).filter((l) => hechas.includes(l.id)).length;
        const pct = total ? Math.round((ok / total) * 100) : 0;
        return (
          <div key={m.id}>
            <div className="flex justify-between text-xs mb-1">
              <span className={`font-semibold ${pct === 100 ? "text-[#00C0E7]" : "text-gray-300"}`}>
                Módulo {m.orderNumber}: {m.title}
              </span>
              <span className="text-gray-500 shrink-0 ml-2">{ok}/{total}</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-[#00C0E7] rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────
export default function MyProgressPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { getSummary, getMyCourses } = useProgressApi();

  const [resumen, setResumen] = useState<ProgressSummary | null>(null);
  const [cursos, setCursos] = useState<MyCourse[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [abierto, setAbierto] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    Promise.all([getSummary(), getMyCourses()]).then(([s, c]) => {
      if (s.success && s.data) setResumen(s.data);
      if (c.success && c.data) setCursos(c.data);
      setCargando(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendientes = cursos.filter((c) => c.progress.percentage === 0).length;
  const enProgreso = cursos.filter((c) => c.progress.percentage > 0 && c.progress.percentage < 100).length;
  const completados = cursos.filter((c) => c.progress.percentage === 100).length;

  const filtrados = cursos
    .filter((c) => {
      const p = c.progress.percentage;
      if (filtro === "progreso") return p > 0 && p < 100;
      if (filtro === "pendientes") return p === 0;
      if (filtro === "completados") return p === 100;
      return true;
    })
    .sort((a, b) => {
      // Primero los que están en curso, luego pendientes, al final completados
      const peso = (p: number) => (p > 0 && p < 100 ? 0 : p === 0 ? 1 : 2);
      return peso(a.progress.percentage) - peso(b.progress.percentage) || b.progress.percentage - a.progress.percentage;
    });

  const restantes = (resumen?.totalLessons ?? 0) - (resumen?.completedLessons ?? 0);

  return (
    <StudentLayout>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="font-brand text-[#00C0E7] text-2xl uppercase tracking-wide">Mi Progreso</h1>
          <p className="text-gray-500 text-sm mt-1">Revisa tu avance en cada curso y lo que te falta para terminar</p>
        </div>

        {cargando ? (
          <div className="flex justify-center py-20"><div className="spinner-cyan" /></div>
        ) : cursos.length === 0 ? (
          <div className="card-dark p-14 text-center">
            <p className="text-gray-400 text-sm">Aún no tienes cursos. Inscríbete en uno para ver tu progreso aquí.</p>
            <Link href="/courses" className="btn-red inline-block mt-4 text-sm">Explorar cursos</Link>
          </div>
        ) : (
          <>
            {/* Resumen general */}
            <div className="card-dark p-6 flex flex-col md:flex-row items-center gap-8">
              <AnilloProgreso pct={resumen?.overallPercentage ?? 0} />
              <div className="flex-1 w-full">
                <p className="text-white font-semibold">
                  Llevas <span className="text-[#00C0E7]">{resumen?.completedLessons ?? 0}</span> de{" "}
                  {resumen?.totalLessons ?? 0} lecciones completadas
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  {restantes > 0
                    ? `Te faltan ${restantes} lecciones para completar todos tus cursos. ¡Sigue así!`
                    : "¡Completaste todas las lecciones de tus cursos!"}
                </p>
                <div className="h-[2px] w-12 bg-[#E31E24] rounded my-4" />
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { v: enProgreso, l: "En progreso" },
                    { v: pendientes, l: "Pendientes" },
                    { v: completados, l: "Completados" },
                  ].map((k) => (
                    <div key={k.l} className="rounded-xl bg-[#0d0d0d] border border-[rgba(0,192,231,0.15)] p-3 text-center">
                      <p className="font-brand text-[#00C0E7] text-2xl leading-none">{k.v}</p>
                      <p className="text-gray-500 text-xs mt-1">{k.l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-2">
              {([
                ["todos", `Todos (${cursos.length})`],
                ["progreso", `En progreso (${enProgreso})`],
                ["pendientes", `Pendientes (${pendientes})`],
                ["completados", `Completados (${completados})`],
              ] as [Filtro, string][]).map(([f, label]) => (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                    filtro === f
                      ? "bg-[#00C0E7] text-[#0d0d0d]"
                      : "border border-[rgba(0,192,231,0.3)] text-gray-400 hover:border-[#00C0E7] hover:text-[#00C0E7]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Cursos */}
            <div className="space-y-4">
              {filtrados.length === 0 && (
                <div className="card-dark p-10 text-center text-gray-500 text-sm">No hay cursos en esta categoría.</div>
              )}
              {filtrados.map((e) => {
                const pct = e.progress.percentage;
                const est = estado(pct);
                const expandido = abierto === e.course.id;
                return (
                  <div key={e.enrollmentId} className="card-dark p-5">
                    <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                      <div className="w-full sm:w-32 h-20 rounded-lg overflow-hidden bg-gray-800 shrink-0">
                        {e.course.image && <img src={e.course.image} alt={e.course.title} className="w-full h-full object-cover" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${est.clase}`}>{est.label}</span>
                          {e.course.category?.name && (
                            <span className="text-[#00C0E7] text-[11px] font-bold uppercase tracking-wide">{e.course.category.name}</span>
                          )}
                        </div>
                        <h3 className="text-white font-semibold mt-1 line-clamp-1">{e.course.title}</h3>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-[#00C0E7] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[#00C0E7] font-bold text-sm w-10 text-right">{pct}%</span>
                        </div>
                        <p className="text-gray-500 text-xs mt-1">
                          {e.progress.completedLessons} de {e.progress.totalLessons} lecciones · Inscrito el{" "}
                          {new Date(e.enrolledAt).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>

                      <div className="flex sm:flex-col gap-2 shrink-0">
                        {pct === 100 ? (
                          <Link href={`/certificates/${e.course.id}`} className="btn-cyan text-xs py-2 px-4">🏆 Certificado</Link>
                        ) : (
                          <Link href={`/courses/${e.course.id}`} className="btn-red text-xs py-2 px-4">
                            {pct > 0 ? "Continuar" : "Comenzar"}
                          </Link>
                        )}
                        <button
                          onClick={() => setAbierto(expandido ? null : e.course.id)}
                          className="text-xs font-semibold text-gray-400 hover:text-[#00C0E7] px-2 py-1 transition-colors"
                        >
                          {expandido ? "Ocultar detalle ▲" : "Ver detalle ▼"}
                        </button>
                      </div>
                    </div>

                    {expandido && (
                      <div className="mt-4 border-t border-gray-800">
                        <DetalleModulos courseId={e.course.id} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </StudentLayout>
  );
}
