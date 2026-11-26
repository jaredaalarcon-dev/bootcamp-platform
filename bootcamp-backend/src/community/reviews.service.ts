// src/community/reviews.service.ts — calificaciones y reseñas de cursos
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CourseReview } from './entities/course-review.entity';
import { estaInscrito, limpiarTexto, nombrePublico } from './community.helpers';
import { N8nService } from '../integrations/n8n.service';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(CourseReview) private readonly repo: Repository<CourseReview>,
    @InjectDataSource() private readonly db: DataSource,
    private readonly n8n: N8nService,
  ) {}

  private vista(r: CourseReview, userId?: string) {
    return {
      id: r.id,
      courseId: r.courseId,
      authorName: r.authorName,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      mine: !!userId && r.userId === userId,
    };
  }

  /** Resumen público: promedio, total, distribución y las reseñas visibles. */
  async forCourse(courseId: string, userId?: string) {
    const [stats] = await this.db.query(
      `SELECT COUNT(*)::int AS total, COALESCE(ROUND(AVG(rating)::numeric, 1), 0)::float AS promedio,
              COUNT(*) FILTER (WHERE rating = 5)::int AS r5, COUNT(*) FILTER (WHERE rating = 4)::int AS r4,
              COUNT(*) FILTER (WHERE rating = 3)::int AS r3, COUNT(*) FILTER (WHERE rating = 2)::int AS r2,
              COUNT(*) FILTER (WHERE rating = 1)::int AS r1
         FROM course_reviews WHERE "courseId" = $1 AND hidden = false`,
      [courseId],
    );
    const items = await this.repo.find({
      where: { courseId, hidden: false },
      order: { updatedAt: 'DESC' },
      take: 50,
    });
    let mine: ReturnType<ReviewsService['vista']> | null = null;
    let puedeReseñar = false;
    if (userId) {
      const r = await this.repo.findOne({ where: { courseId, userId } });
      mine = r ? { ...this.vista(r, userId), hidden: r.hidden } as any : null;
      puedeReseñar = await estaInscrito(this.db, userId, courseId);
    }
    return {
      total: stats.total,
      promedio: stats.promedio,
      distribucion: { 5: stats.r5, 4: stats.r4, 3: stats.r3, 2: stats.r2, 1: stats.r1 },
      items: items.map((r) => this.vista(r, userId)),
      mine,
      canReview: puedeReseñar,
    };
  }

  /** Promedio y total de todos los cursos (para el catálogo). */
  async summaries() {
    const filas: { courseId: string; promedio: number; total: number }[] = await this.db.query(
      `SELECT "courseId", ROUND(AVG(rating)::numeric, 1)::float AS promedio, COUNT(*)::int AS total
         FROM course_reviews WHERE hidden = false GROUP BY "courseId"`,
    );
    return Object.fromEntries(filas.map((f) => [f.courseId, { promedio: f.promedio, total: f.total }]));
  }

  async upsert(userId: string, courseId: string, rating: number, comment?: string) {
    const [curso] = await this.db.query(`SELECT id FROM courses WHERE id = $1`, [courseId]);
    if (!curso) throw new NotFoundException('Curso no encontrado');
    if (!(await estaInscrito(this.db, userId, courseId))) {
      throw new ForbiddenException('Inscríbete al curso para calificarlo');
    }
    const texto = limpiarTexto(comment ?? '');
    let r = await this.repo.findOne({ where: { userId, courseId } });
    const nueva = !r;
    if (!r) {
      r = this.repo.create({ userId, courseId, authorName: await nombrePublico(this.db, userId) });
    } else {
      r.authorName = await nombrePublico(this.db, userId);
    }
    r.rating = Math.round(rating);
    r.comment = texto || null;
    r = await this.repo.save(r);
    if (nueva) {
      const [c] = await this.db.query(`SELECT title FROM courses WHERE id = $1`, [courseId]);
      this.n8n.emitir('resena.nueva', { alumno: r.authorName, curso: c?.title, courseId, estrellas: r.rating, comentario: r.comment });
    }
    return { ...this.vista(r, userId), hidden: r.hidden };
  }

  async removeOwn(userId: string, courseId: string) {
    const r = await this.repo.delete({ userId, courseId });
    if (!r.affected) throw new NotFoundException('No tienes una reseña en este curso');
    return { courseId, eliminado: true };
  }

  // ── Admin ───────────────────────────────────────────────────────────────
  async adminList(courseId?: string) {
    const filas = await this.repo.find({
      where: courseId ? { courseId } : {},
      relations: { course: true },
      order: { updatedAt: 'DESC' },
      take: 300,
    });
    const [stats] = await this.db.query(
      `SELECT COUNT(*)::int AS total, COALESCE(ROUND(AVG(rating)::numeric, 1), 0)::float AS promedio,
              COUNT(*) FILTER (WHERE hidden)::int AS ocultas
         FROM course_reviews`,
    );
    return {
      ...stats,
      items: filas.map((r) => ({ ...this.vista(r), hidden: r.hidden, courseTitle: r.course?.title ?? '' })),
    };
  }

  async setHidden(id: string, hidden: boolean) {
    const r = await this.repo.findOne({ where: { id } });
    if (!r) throw new NotFoundException('Reseña no encontrada');
    r.hidden = hidden;
    await this.repo.save(r);
    return { id, hidden };
  }

  async adminRemove(id: string) {
    const r = await this.repo.delete({ id });
    if (!r.affected) throw new NotFoundException('Reseña no encontrada');
    return { id, eliminado: true };
  }
}
