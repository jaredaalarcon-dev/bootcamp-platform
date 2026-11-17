// src/admin/payments.service.ts
// "Pagos y certificados" del panel admin.
// El pago se coordina por WhatsApp; aquí el admin lo confirma para que el
// alumno pueda descargar su certificado oficial (sin pago recibe constancia).
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Enrollment } from '../enrollments/entities/enrollment.entity';

interface FilaPago {
  id: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  status: string;
  enrolledAt: Date;
  paid: boolean;
  paidAt: Date | null;
  paymentNote: string | null;
  totalLessons: number;
  completedLessons: number;
  issuedTypes: string | null;
}

@Injectable()
export class PaymentsService {
  private supabaseAdmin: SupabaseClient;

  constructor(
    @InjectDataSource() private db: DataSource,
    @InjectRepository(Enrollment) private enrollmentRepo: Repository<Enrollment>,
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

  async list() {
    const filas: FilaPago[] = await this.db.query(`
      SELECT e.id, e."userId", e."courseId", c.title AS "courseTitle", e.status,
             e."enrolledAt", e.paid, e."paidAt", e."paymentNote",
             COALESCE(t.total, 0)::int AS "totalLessons",
             COALESCE(p.hechas, 0)::int AS "completedLessons",
             ic.tipos AS "issuedTypes"
        FROM enrollments e
        JOIN courses c ON c.id = e."courseId"
        LEFT JOIN (
          SELECT m."courseId", COUNT(l.id) AS total
            FROM lessons l JOIN modules m ON m.id = l."moduleId"
           GROUP BY m."courseId"
        ) t ON t."courseId" = e."courseId"
        LEFT JOIN (
          SELECT pr."userId", m."courseId", COUNT(*) AS hechas
            FROM progress pr
            JOIN lessons l ON l.id = pr."lessonId"
            JOIN modules m ON m.id = l."moduleId"
           WHERE pr.status = 'completed'
           GROUP BY pr."userId", m."courseId"
        ) p ON p."userId" = e."userId" AND p."courseId" = e."courseId"
        LEFT JOIN (
          SELECT "userId", "courseId", STRING_AGG(type, ',') AS tipos
            FROM issued_certificates
           WHERE revoked = false
           GROUP BY "userId", "courseId"
        ) ic ON ic."userId" = e."userId"::text AND ic."courseId" = e."courseId"
       ORDER BY e.paid ASC, e."enrolledAt" DESC
    `);

    // Nombre y correo de cada alumno (vienen de Supabase)
    const ids = [...new Set(filas.map((f) => f.userId))];
    const alumnos = new Map<string, { nombre: string; email: string }>();
    if (ids.length) {
      const { data } = await this.supabaseAdmin
        .from('profiles')
        .select('supabase_id, first_name, last_name, email')
        .in('supabase_id', ids);
      for (const p of data ?? []) {
        const nombre = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim();
        alumnos.set(p.supabase_id, { nombre: nombre || (p.email ?? '').split('@')[0], email: p.email ?? '' });
      }
    }
    // Alumnos que ya registraron sus datos y foto para el certificado
    const perfilesCert: { userId: string }[] = ids.length
      ? await this.db.query(
          `SELECT "userId" FROM certificate_profiles
            WHERE "userId" = ANY($1) AND "photoPath" IS NOT NULL AND "documentNumber" <> ''`,
          [ids],
        )
      : [];
    const datosCompletos = new Set(perfilesCert.map((p) => p.userId));

    return filas.map((f) => {
      const pct = f.totalLessons > 0 ? Math.round((f.completedLessons / f.totalLessons) * 100) : 0;
      const tipos = (f.issuedTypes ?? '').split(',').filter(Boolean);
      return {
        enrollmentId: f.id,
        userId: f.userId,
        studentName: alumnos.get(f.userId)?.nombre ?? 'Alumno',
        email: alumnos.get(f.userId)?.email ?? '',
        courseId: f.courseId,
        courseTitle: f.courseTitle,
        enrolledAt: f.enrolledAt,
        percentage: pct,
        paid: f.paid,
        paidAt: f.paidAt,
        paymentNote: f.paymentNote,
        profileComplete: datosCompletos.has(f.userId),
        certificateIssued: tipos.includes('certificado'),
        constanciaIssued: tipos.includes('constancia'),
      };
    });
  }

  async setPayment(enrollmentId: string, paid: boolean, note?: string | null) {
    const inscripcion = await this.enrollmentRepo.findOne({ where: { id: enrollmentId } });
    if (!inscripcion) throw new NotFoundException('Inscripción no encontrada');
    inscripcion.paid = paid;
    inscripcion.paidAt = paid ? (inscripcion.paidAt ?? new Date()) : null;
    if (note !== undefined) {
      const limpia = (note ?? '').trim().slice(0, 200);
      inscripcion.paymentNote = limpia || null;
    }
    await this.enrollmentRepo.save(inscripcion);
    return {
      enrollmentId: inscripcion.id,
      paid: inscripcion.paid,
      paidAt: inscripcion.paidAt,
      paymentNote: inscripcion.paymentNote,
    };
  }
}
