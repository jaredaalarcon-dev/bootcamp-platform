// src/community/questions.service.ts — preguntas y comentarios por lección
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import { LessonQuestion } from './entities/lesson-question.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { estaInscrito, limpiarTexto, nombrePublico } from './community.helpers';

const LIMITE_POR_HORA = 10;

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(LessonQuestion) private readonly repo: Repository<LessonQuestion>,
    @InjectDataSource() private readonly db: DataSource,
    private readonly notifications: NotificationsService,
  ) {}

  private async leccion(lessonId: string) {
    const [l] = await this.db.query(
      `SELECT l.id, l.title, m."courseId" AS "courseId", c.title AS "courseTitle"
         FROM lessons l JOIN modules m ON m.id = l."moduleId" JOIN courses c ON c.id = m."courseId"
        WHERE l.id = $1`,
      [lessonId],
    );
    if (!l) throw new NotFoundException('Lección no encontrada');
    return l as { id: string; title: string; courseId: string; courseTitle: string };
  }

  private vista(q: LessonQuestion, userId?: string) {
    return {
      id: q.id,
      lessonId: q.lessonId,
      authorName: q.authorName,
      question: q.question,
      answer: q.answer,
      answeredAt: q.answeredAt,
      answeredBy: q.answeredBy,
      createdAt: q.createdAt,
      mine: !!userId && q.userId === userId,
    };
  }

  async listForLesson(userId: string, lessonId: string) {
    const l = await this.leccion(lessonId);
    if (!(await estaInscrito(this.db, userId, l.courseId))) return [];
    const filas = await this.repo.find({ where: { lessonId }, order: { createdAt: 'DESC' }, take: 100 });
    return filas.map((q) => this.vista(q, userId));
  }

  async ask(userId: string, lessonId: string, texto: string) {
    const l = await this.leccion(lessonId);
    if (!(await estaInscrito(this.db, userId, l.courseId))) {
      throw new ForbiddenException('Inscríbete al curso para hacer preguntas');
    }
    const pregunta = limpiarTexto(texto);
    if (pregunta.length < 5) throw new BadRequestException('Escribe tu pregunta con un poco más de detalle');

    const [{ n }] = await this.db.query(
      `SELECT COUNT(*)::int AS n FROM lesson_questions WHERE "userId" = $1 AND "createdAt" > now() - interval '1 hour'`,
      [userId],
    );
    if (n >= LIMITE_POR_HORA) {
      throw new BadRequestException('Hiciste muchas preguntas seguidas. Inténtalo de nuevo en un rato.');
    }

    const q = await this.repo.save(this.repo.create({
      userId,
      lessonId,
      courseId: l.courseId,
      authorName: await nombrePublico(this.db, userId),
      question: pregunta,
    }));
    return this.vista(q, userId);
  }

  async removeOwn(userId: string, id: string) {
    const q = await this.repo.findOne({ where: { id, userId } });
    if (!q) throw new NotFoundException('Pregunta no encontrada');
    if (q.answer) throw new BadRequestException('No puedes borrar una pregunta que ya fue respondida');
    await this.repo.remove(q);
    return { id, eliminado: true };
  }

  // ── Admin ───────────────────────────────────────────────────────────────
  async adminList(estado?: string, courseId?: string) {
    const where: Record<string, unknown> = {};
    if (estado === 'pendientes') where.answeredAt = IsNull();
    if (estado === 'respondidas') where.answeredAt = Not(IsNull());
    if (courseId) where.courseId = courseId;
    const filas = await this.repo.find({
      where,
      relations: { lesson: { module: { course: true } } },
      order: { createdAt: estado === 'respondidas' ? 'DESC' : 'ASC' },
      take: 300,
    });
    const [{ pendientes }] = await this.db.query(
      `SELECT COUNT(*)::int AS pendientes FROM lesson_questions WHERE "answeredAt" IS NULL`,
    );
    return {
      pendientes,
      items: filas.map((q) => ({
        ...this.vista(q),
        courseId: q.courseId,
        courseTitle: q.lesson?.module?.course?.title ?? '',
        moduleTitle: q.lesson?.module?.title ?? '',
        lessonTitle: q.lesson?.title ?? '',
      })),
    };
  }

  async pendingCount() {
    const [{ n }] = await this.db.query(
      `SELECT COUNT(*)::int AS n FROM lesson_questions WHERE "answeredAt" IS NULL`,
    );
    return { pendientes: n };
  }

  async answer(id: string, texto: string, admin: { email?: string }) {
    const q = await this.repo.findOne({ where: { id } });
    if (!q) throw new NotFoundException('Pregunta no encontrada');
    const respuesta = limpiarTexto(texto);
    if (respuesta.length < 2) throw new BadRequestException('La respuesta está vacía');
    const primeraVez = !q.answer;

    q.answer = respuesta;
    q.answeredAt = new Date();
    q.answeredBy = 'Equipo SIJB';
    await this.repo.save(q);

    const l = await this.leccion(q.lessonId);
    await this.notifications.notify(q.userId, {
      type: 'respuesta',
      title: primeraVez ? 'Respondieron tu pregunta' : 'Actualizaron la respuesta a tu pregunta',
      message: `En la lección "${l.title}" de ${l.courseTitle}: ${respuesta.slice(0, 180)}${respuesta.length > 180 ? '…' : ''}`,
      link: `/courses/${l.courseId}?leccion=${q.lessonId}#preguntas`,
    });
    void admin;
    return this.vista(q);
  }

  async adminRemove(id: string) {
    const r = await this.repo.delete({ id });
    if (!r.affected) throw new NotFoundException('Pregunta no encontrada');
    return { id, eliminado: true };
  }
}
