// src/admin/analytics.service.ts
// Métricas avanzadas para "Reportes y Métricas" del panel admin.
// Todo se calcula en una sola llamada: GET /admin/analytics?days=30
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DIA = 86_400_000;
// Perú no tiene horario de verano: UTC−5 todo el año
const OFFSET_LIMA = -5 * 3_600_000;
const aLima = (d: Date | string) => new Date(new Date(d).getTime() + OFFSET_LIMA);
const claveDia = (d: Date) => d.toISOString().slice(0, 10);

interface FilaInscripcion { userId: string; courseId: string; status: string; enrolledAt: Date }
interface FilaLeccion { userId: string; courseId: string; at: Date }

@Injectable()
export class AnalyticsService {
  private supabaseAdmin: SupabaseClient;

  constructor(
    @InjectDataSource() private db: DataSource,
    private config: ConfigService,
  ) {
    const url = this.config.get<string>('SUPABASE_URL') ?? '';
    const key =
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY') ??
      this.config.get<string>('SUPABASE_KEY') ??
      '';
    this.supabaseAdmin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  async getAnalytics(diasPedidos: number) {
    const dias = [7, 30, 90, 365].includes(diasPedidos) ? diasPedidos : 30;
    const ahora = Date.now();
    const desde = ahora - dias * DIA;
    const desdeAnterior = ahora - 2 * dias * DIA;

    // ── Datos base ───────────────────────────────────────────────────────
    const [inscripcionesRaw, leccionesRaw, totalesRaw, cursosRaw] = await Promise.all([
      this.db.query(
        `SELECT "userId", "courseId", "status", ("enrolledAt" AT TIME ZONE 'UTC') AS "enrolledAt" FROM enrollments`,
      ),
      this.db.query(
        `SELECT p."userId", m."courseId", p."updatedAt" AS "at"
           FROM progress p
           JOIN lessons l ON l.id = p."lessonId"
           JOIN modules m ON m.id = l."moduleId"
          WHERE p.status = 'completed'`,
      ),
      this.db.query(
        `SELECT m."courseId", COUNT(l.id)::int AS total
           FROM lessons l JOIN modules m ON m.id = l."moduleId"
          GROUP BY m."courseId"`,
      ),
      this.db.query(
        `SELECT c.id, c.title, c.status, c.image, cat.name AS category
           FROM courses c LEFT JOIN categories cat ON cat.id = c."categoryId"`,
      ),
    ]);

    const inscripciones: FilaInscripcion[] = inscripcionesRaw;
    const lecciones: FilaLeccion[] = leccionesRaw;
    const totalLecciones = new Map<string, number>(totalesRaw.map((r: any) => [r.courseId, Number(r.total)]));
    const cursos = new Map<string, any>(cursosRaw.map((c: any) => [c.id, c]));

    // Perfiles (alumnos) desde Supabase
    const [{ data: perfiles }, { data: roles }] = await Promise.all([
      this.supabaseAdmin.from('profiles').select('supabase_id, first_name, last_name, email, created_at, role_id'),
      this.supabaseAdmin.from('roles').select('id, name'),
    ]);
    const idAdmin = (roles ?? []).find((r: any) => r.name === 'admin')?.id;
    const alumnos = (perfiles ?? []).filter((p: any) => p.role_id !== idAdmin);
    const nombre = new Map<string, { nombre: string; email: string }>(
      (perfiles ?? []).map((p: any) => [
        p.supabase_id,
        {
          nombre: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || (p.email ?? '').split('@')[0] || 'Alumno',
          email: p.email ?? '',
        },
      ]),
    );

    // ── Avance por inscripción ───────────────────────────────────────────
    const hechasPor = new Map<string, number>(); // userId|courseId -> lecciones completadas
    for (const l of lecciones) {
      const k = `${l.userId}|${l.courseId}`;
      hechasPor.set(k, (hechasPor.get(k) ?? 0) + 1);
    }
    const avance = inscripciones.map((e) => {
      const total = totalLecciones.get(e.courseId) ?? 0;
      const hechas = hechasPor.get(`${e.userId}|${e.courseId}`) ?? 0;
      const pct = total > 0 ? Math.min(100, Math.round((hechas / total) * 100)) : 0;
      const estado = e.status === 'completed' || (total > 0 && hechas >= total)
        ? 'completado'
        : hechas > 0 ? 'en_progreso' : 'sin_iniciar';
      return { ...e, total, hechas, pct, estado };
    });

    // ── Estado de inscripciones (donut) ──────────────────────────────────
    const estado = {
      completado: avance.filter((a) => a.estado === 'completado').length,
      en_progreso: avance.filter((a) => a.estado === 'en_progreso').length,
      sin_iniciar: avance.filter((a) => a.estado === 'sin_iniciar').length,
    };

    // ── Línea de tiempo ──────────────────────────────────────────────────
    const semanal = dias === 365;
    const paso = semanal ? 7 : 1;
    const puntos = Math.ceil(dias / paso);
    const inicioLima = aLima(new Date(ahora - (puntos * paso - 1) * DIA));
    inicioLima.setUTCHours(0, 0, 0, 0);
    const indice = (d: Date | string) =>
      Math.floor((aLima(d).getTime() - inicioLima.getTime()) / (paso * DIA));
    const serie = Array.from({ length: puntos }, (_, i) => ({
      date: claveDia(new Date(inicioLima.getTime() + i * paso * DIA)),
      enrollments: 0,
      lessons: 0,
      students: 0,
    }));
    const sumar = (d: Date | string, campo: 'enrollments' | 'lessons' | 'students') => {
      const i = indice(d);
      if (i >= 0 && i < puntos) serie[i][campo]++;
    };
    inscripciones.forEach((e) => sumar(e.enrolledAt, 'enrollments'));
    lecciones.forEach((l) => sumar(l.at, 'lessons'));
    alumnos.forEach((p: any) => p.created_at && sumar(p.created_at, 'students'));

    // ── KPIs del periodo vs. periodo anterior ────────────────────────────
    const enRango = (d: Date | string, a: number, b: number) => {
      const t = new Date(d).getTime();
      return t >= a && t < b;
    };
    const contar = <T>(lista: T[], fecha: (x: T) => Date | string | null) => ({
      actual: lista.filter((x) => fecha(x) && enRango(fecha(x)!, desde, ahora + 1)).length,
      anterior: lista.filter((x) => fecha(x) && enRango(fecha(x)!, desdeAnterior, desde)).length,
    });
    const kpis = {
      enrollments: contar(inscripciones, (e) => e.enrolledAt),
      lessons: contar(lecciones, (l) => l.at),
      students: contar(alumnos as any[], (p: any) => p.created_at),
      activeStudents: {
        actual: new Set(lecciones.filter((l) => enRango(l.at, desde, ahora + 1)).map((l) => l.userId)).size,
        anterior: new Set(lecciones.filter((l) => enRango(l.at, desdeAnterior, desde)).map((l) => l.userId)).size,
      },
      totalStudents: alumnos.length,
      totalEnrollments: inscripciones.length,
      completionRate: inscripciones.length ? Math.round((estado.completado / inscripciones.length) * 100) : 0,
      avgProgress: avance.length ? Math.round(avance.reduce((s, a) => s + a.pct, 0) / avance.length) : 0,
    };

    // ── Mapa de calor: ¿cuándo estudian? (día × hora, hora de Lima) ──────
    const calor = Array.from({ length: 7 }, () => Array(24).fill(0)); // 0 = lunes
    lecciones
      .filter((l) => enRango(l.at, desde, ahora + 1))
      .forEach((l) => {
        const d = aLima(l.at);
        calor[(d.getUTCDay() + 6) % 7][d.getUTCHours()]++;
      });

    // ── Embudo de aprendizaje ────────────────────────────────────────────
    const usuariosCon = (f: (a: (typeof avance)[number]) => boolean) =>
      new Set(avance.filter(f).map((a) => a.userId)).size;
    const funnel = [
      { key: 'registered', label: 'Registrados', value: alumnos.length },
      { key: 'enrolled', label: 'Se inscribieron', value: new Set(inscripciones.map((e) => e.userId)).size },
      { key: 'started', label: 'Empezaron un curso', value: usuariosCon((a) => a.hechas > 0) },
      { key: 'half', label: 'Llegaron al 50%', value: usuariosCon((a) => a.pct >= 50) },
      { key: 'completed', label: 'Obtuvieron certificado', value: usuariosCon((a) => a.estado === 'completado') },
    ];

    // ── Por curso ────────────────────────────────────────────────────────
    const porCurso = [...cursos.values()].map((c) => {
      const delCurso = avance.filter((a) => a.courseId === c.id);
      return {
        id: c.id,
        title: c.title,
        category: c.category ?? '',
        status: c.status,
        image: c.image ?? null,
        lessons: totalLecciones.get(c.id) ?? 0,
        enrollments: delCurso.length,
        completions: delCurso.filter((a) => a.estado === 'completado').length,
        inProgress: delCurso.filter((a) => a.estado === 'en_progreso').length,
        avgProgress: delCurso.length ? Math.round(delCurso.reduce((s, a) => s + a.pct, 0) / delCurso.length) : 0,
        newEnrollments: delCurso.filter((a) => enRango(a.enrolledAt, desde, ahora + 1)).length,
      };
    }).sort((a, b) => b.enrollments - a.enrollments);

    // ── Alumnos más activos del periodo ──────────────────────────────────
    const actividad = new Map<string, number>();
    lecciones.filter((l) => enRango(l.at, desde, ahora + 1))
      .forEach((l) => actividad.set(l.userId, (actividad.get(l.userId) ?? 0) + 1));
    const topStudents = [...actividad.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([userId, lessons]) => ({
        name: nombre.get(userId)?.nombre ?? 'Alumno',
        email: nombre.get(userId)?.email ?? '',
        lessons,
        courses: new Set(avance.filter((a) => a.userId === userId).map((a) => a.courseId)).size,
        certificates: avance.filter((a) => a.userId === userId && a.estado === 'completado').length,
      }));

    return {
      days: dias,
      granularity: semanal ? 'week' : 'day',
      kpis,
      timeline: serie,
      status: estado,
      heatmap: calor,
      funnel,
      courses: porCurso,
      topStudents,
      generatedAt: new Date().toISOString(),
    };
  }
}
