// src/admin/admin.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Category } from '../courses/entities/category.entity';

@Injectable()
export class AdminService {
  private supabaseAdmin: SupabaseClient;

  constructor(
    @InjectRepository(Course)
    private courseRepo: Repository<Course>,
    @InjectRepository(Enrollment)
    private enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
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

  // ── Stats para el dashboard admin ────────────────────────────────────────
  async getStats() {
    const [totalCourses, totalCategories, totalEnrollments, completedEnrollments] =
      await Promise.all([
        this.courseRepo.count(),
        this.categoryRepo.count(),
        this.enrollmentRepo.count(),
        this.enrollmentRepo.count({ where: { status: 'completed' } }),
      ]);

    // Alumnos únicos desde Supabase profiles
    const { count: totalStudents } = await this.supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const completionRate =
      totalEnrollments > 0
        ? Math.round((completedEnrollments / totalEnrollments) * 100)
        : 0;

    // Inscripciones por curso (top 5)
    const topCourses = await this.enrollmentRepo
      .createQueryBuilder('e')
      .select('e.courseId', 'courseId')
      .addSelect('COUNT(*)', 'enrollments')
      .addSelect('c.title', 'title')
      .leftJoin('courses', 'c', 'c.id = e."courseId"')
      .groupBy('e.courseId')
      .addGroupBy('c.title')
      .orderBy('COUNT(*)', 'DESC')
      .limit(5)
      .getRawMany();

    return {
      totalCourses,
      totalCategories,
      totalStudents: totalStudents ?? 0,
      totalEnrollments,
      completedEnrollments,
      completionRate,
      topCourses,
    };
  }

  // ── Lista de usuarios ─────────────────────────────────────────────────────
  async getUsers() {
    const { data: profiles, error } = await this.supabaseAdmin
      .from('profiles')
      .select('id, email, first_name, last_name, role_id, created_at, supabase_id')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    // Roles
    const { data: roles } = await this.supabaseAdmin
      .from('roles')
      .select('id, name');

    const roleMap: Record<string, string> = Object.fromEntries(
      (roles ?? []).map((r) => [r.id, r.name]),
    );

    // Conteo de inscripciones por usuario
    const rawEnrollments = await this.enrollmentRepo
      .createQueryBuilder('e')
      .select('e.userId', 'userId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('e.userId')
      .getRawMany();

    const enrollMap: Record<string, number> = Object.fromEntries(
      rawEnrollments.map((r) => [r.userId, parseInt(r.count, 10)]),
    );

    return (profiles ?? []).map((p) => ({
      id: p.id,
      supabaseId: p.supabase_id,
      email: p.email ?? '',
      firstName: p.first_name ?? '',
      lastName: p.last_name ?? '',
      role: roleMap[p.role_id] ?? 'student',
      roleId: p.role_id,
      enrollments: enrollMap[p.supabase_id] ?? 0,
      createdAt: p.created_at,
    }));
  }

  // ── Cambiar rol de un usuario ─────────────────────────────────────────────
  async updateUserRole(profileId: string, roleName: string) {
    const { data: rol } = await this.supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', roleName)
      .single();

    if (!rol) throw new Error(`Rol "${roleName}" no encontrado`);

    const { error } = await this.supabaseAdmin
      .from('profiles')
      .update({ role_id: rol.id })
      .eq('id', profileId);

    if (error) throw new Error(error.message);
    return { updated: true, role: roleName };
  }

  // ── Reportes: inscripciones y progreso por curso ──────────────────────────
  async getReports() {
    const courses = await this.courseRepo.find({
      relations: { category: true },
      order: { createdAt: 'DESC' },
    });

    const enrollsByCourseFull = await this.enrollmentRepo
      .createQueryBuilder('e')
      .select('e.courseId', 'courseId')
      .addSelect('COUNT(*)', 'total')
      .addSelect(
        'SUM(CASE WHEN e.status = \'completed\' THEN 1 ELSE 0 END)',
        'completed',
      )
      .groupBy('e.courseId')
      .getRawMany();

    const map = Object.fromEntries(
      enrollsByCourseFull.map((r) => [
        r.courseId,
        { total: parseInt(r.total, 10), completed: parseInt(r.completed, 10) },
      ]),
    );

    return courses.map((c) => ({
      id: c.id,
      title: c.title,
      category: c.category?.name ?? '',
      status: c.status,
      enrollments: map[c.id]?.total ?? 0,
      completions: map[c.id]?.completed ?? 0,
      completionRate:
        (map[c.id]?.total ?? 0) > 0
          ? Math.round(((map[c.id]?.completed ?? 0) / map[c.id].total) * 100)
          : 0,
    }));
  }
}
