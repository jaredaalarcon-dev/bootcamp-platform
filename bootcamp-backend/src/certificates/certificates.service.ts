// src/certificates/certificates.service.ts
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Lesson } from '../courses/entities/lesson.entity';
import { Progress } from '../progress/entities/progress.entity';

@Injectable()
export class CertificatesService {
  private supabaseAdmin: SupabaseClient;

  constructor(
    @InjectRepository(Enrollment)
    private enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Lesson)
    private lessonRepo: Repository<Lesson>,
    @InjectRepository(Progress)
    private progressRepo: Repository<Progress>,
    private configService: ConfigService,
  ) {
    const url = this.configService.get<string>('SUPABASE_URL') ?? '';
    const key =
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ??
      this.configService.get<string>('SUPABASE_KEY') ??
      '';
    this.supabaseAdmin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  async getCertificate(userId: string, courseId: string) {
    // 1. Verificar inscripción
    const enrollment = await this.enrollmentRepo.findOne({
      where: { userId, courseId },
      relations: { course: { category: true } },
    });

    if (!enrollment) {
      throw new NotFoundException('No estás inscrito en este curso');
    }

    // 2. Verificar progreso 100%
    const totalLessons = await this.lessonRepo.count({
      where: { module: { course: { id: courseId } } },
    });

    const completed = await this.progressRepo.count({
      where: {
        userId,
        status: 'completed',
        lesson: { module: { course: { id: courseId } } },
      },
    });

    const percentage =
      totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;

    if (percentage < 100) {
      throw new ForbiddenException(
        `Debes completar el 100% del curso para obtener el certificado. Llevas ${percentage}%.`,
      );
    }

    // 3. Datos del alumno
    const { data: profile } = await this.supabaseAdmin
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('supabase_id', userId)
      .single();

    const nombre =
      profile?.first_name || profile?.last_name
        ? `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim()
        : (profile?.email?.split('@')[0] ?? 'Estudiante');

    // 4. ID de certificado único y determinista: no cambia si se recarga
    const raw = `${courseId}-${userId}`;
    const hash = [...raw].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 0);
    const certificateId = `SIJB-${hash.toString(16).toUpperCase().padStart(8, '0')}`;

    return {
      certificateId,
      studentName: nombre,
      courseName: enrollment.course.title,
      courseCategory: enrollment.course.category?.name ?? '',
      courseImage: enrollment.course.image ?? '',
      completedAt: enrollment.updatedAt,
      totalLessons,
      percentage,
    };
  }
}
