// src/quizzes/quizzes.service.ts — cuestionarios por módulo o por lección
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Quiz } from './entities/quiz.entity';
import { QuizQuestion } from './entities/quiz-question.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';
import { SaveQuizDto } from './dto/quiz.dto';
import { estaInscrito } from '../community/community.helpers';
import { NotificationsService } from '../notifications/notifications.service';
import { N8nService } from '../integrations/n8n.service';

const INTENTOS_POR_HORA = 20;

@Injectable()
export class QuizzesService {
  constructor(
    @InjectRepository(Quiz) private readonly quizzes: Repository<Quiz>,
    @InjectRepository(QuizAttempt) private readonly attempts: Repository<QuizAttempt>,
    @InjectDataSource() private readonly db: DataSource,
    private readonly notifications: NotificationsService,
    private readonly n8n: N8nService,
  ) {}

  private esFinal(q: { moduleId: string | null; lessonId: string | null }) {
    return !q.moduleId && !q.lessonId;
  }

  /** Porcentaje de lecciones completadas del curso. */
  private async porcentaje(userId: string, courseId: string) {
    const [r] = await this.db.query(
      `SELECT COUNT(l.id)::int AS total,
              COUNT(p.id) FILTER (WHERE p.status = 'completed')::int AS hechas
         FROM lessons l JOIN modules m ON m.id = l."moduleId"
         LEFT JOIN progress p ON p."lessonId" = l.id AND p."userId" = $1
        WHERE m."courseId" = $2`,
      [userId, courseId],
    );
    return r.total > 0 ? Math.round((r.hechas / r.total) * 100) : 0;
  }

  private async exigirCien(userId: string, quiz: Quiz) {
    if (!this.esFinal(quiz)) return;
    const pct = await this.porcentaje(userId, quiz.courseId);
    if (pct < 100) {
      throw new ForbiddenException(`El examen final se desbloquea al completar el 100 % del curso. Llevas ${pct} %.`);
    }
  }

  // ── Alumno ──────────────────────────────────────────────────────────────
  /** Cuestionarios publicados del curso, con mi mejor nota en cada uno. */
  async listForCourse(userId: string, courseId: string) {
    const filas = await this.db.query(
      `SELECT q.id, q.title, q.description, q."moduleId", q."lessonId", q."passingScore",
              (SELECT COUNT(*)::int FROM quiz_questions qq WHERE qq."quizId" = q.id) AS "questionCount",
              (SELECT MAX(a.score)::int FROM quiz_attempts a WHERE a."quizId" = q.id AND a."userId" = $2) AS "bestScore",
              (SELECT COUNT(*)::int FROM quiz_attempts a WHERE a."quizId" = q.id AND a."userId" = $2) AS attempts,
              EXISTS (SELECT 1 FROM quiz_attempts a WHERE a."quizId" = q.id AND a."userId" = $2 AND a.passed) AS passed,
              (q."moduleId" IS NULL AND q."lessonId" IS NULL) AS "isFinal"
         FROM quizzes q
        WHERE q."courseId" = $1 AND q.published = true
        ORDER BY q."createdAt" ASC`,
      [courseId, userId],
    );
    return filas.filter((f: { questionCount: number }) => f.questionCount > 0);
  }

  private async publicado(quizId: string) {
    const quiz = await this.quizzes.findOne({
      where: { id: quizId, published: true },
      relations: { questions: true },
      order: { questions: { orderNumber: 'ASC' } },
    });
    if (!quiz || !quiz.questions?.length) throw new NotFoundException('Cuestionario no encontrado');
    return quiz;
  }

  /** Preguntas para resolver (sin las respuestas correctas). */
  async getForStudent(userId: string, quizId: string) {
    const quiz = await this.publicado(quizId);
    if (!(await estaInscrito(this.db, userId, quiz.courseId))) {
      throw new ForbiddenException('Inscríbete al curso para resolver el cuestionario');
    }
    await this.exigirCien(userId, quiz);
    const [mejor] = await this.db.query(
      `SELECT MAX(score)::int AS "bestScore", COUNT(*)::int AS attempts, BOOL_OR(passed) AS passed
         FROM quiz_attempts WHERE "quizId" = $1 AND "userId" = $2`,
      [quizId, userId],
    );
    return {
      id: quiz.id,
      courseId: quiz.courseId,
      moduleId: quiz.moduleId,
      lessonId: quiz.lessonId,
      title: quiz.title,
      description: quiz.description,
      passingScore: quiz.passingScore,
      isFinal: this.esFinal(quiz),
      bestScore: mejor?.bestScore ?? null,
      attempts: mejor?.attempts ?? 0,
      passed: !!mejor?.passed,
      questions: quiz.questions.map((q) => ({ id: q.id, text: q.text, options: q.options })),
    };
  }

  async submit(userId: string, quizId: string, respuestas: Record<string, number>) {
    const quiz = await this.publicado(quizId);
    if (!(await estaInscrito(this.db, userId, quiz.courseId))) {
      throw new ForbiddenException('Inscríbete al curso para resolver el cuestionario');
    }
    await this.exigirCien(userId, quiz);
    const [{ n }] = await this.db.query(
      `SELECT COUNT(*)::int AS n FROM quiz_attempts
        WHERE "quizId" = $1 AND "userId" = $2 AND "createdAt" > now() - interval '1 hour'`,
      [quizId, userId],
    );
    if (n >= INTENTOS_POR_HORA) {
      throw new BadRequestException('Hiciste muchos intentos seguidos. Repasa la lección e inténtalo más tarde.');
    }

    const limpias: Record<string, number> = {};
    let correctas = 0;
    const resultados = quiz.questions.map((q) => {
      const elegida = Number.isInteger(respuestas?.[q.id]) ? Number(respuestas[q.id]) : -1;
      const valida = elegida >= 0 && elegida < q.options.length ? elegida : -1;
      if (valida >= 0) limpias[q.id] = valida;
      const ok = valida === q.correctIndex;
      if (ok) correctas++;
      return { questionId: q.id, chosen: valida, correctIndex: q.correctIndex, correct: ok, explanation: q.explanation };
    });
    const total = quiz.questions.length;
    const nota = Math.round((correctas / total) * 100);
    const aprobado = nota >= quiz.passingScore;

    await this.attempts.save(this.attempts.create({
      quizId, userId, score: nota, correctCount: correctas, totalQuestions: total, passed: aprobado, answers: limpias,
    }));
    const [mejor] = await this.db.query(
      `SELECT MAX(score)::int AS "bestScore", COUNT(*)::int AS attempts FROM quiz_attempts WHERE "quizId" = $1 AND "userId" = $2`,
      [quizId, userId],
    );
    if (aprobado && this.esFinal(quiz)) {
      const [curso] = await this.db.query(`SELECT title FROM courses WHERE id = $1`, [quiz.courseId]);
      const [p] = await this.db.query(`SELECT email, first_name AS nombre FROM profiles WHERE supabase_id = $1`, [userId]);
      this.n8n.emitir('examen_final.aprobado', { userId, email: p?.email, nombre: p?.nombre, courseId: quiz.courseId, curso: curso?.title, nota: nota });
      await this.notifications.notify(userId, {
        type: 'constancia',
        title: '¡Aprobaste el examen final! Tu constancia está lista',
        message: `Aprobaste el examen final de "${curso?.title ?? 'tu curso'}" con ${nota} %. Ya puedes descargar tu constancia.`,
        link: `/certificates/${quiz.courseId}`,
        key: `examen_final:${quiz.id}`,
      });
    }
    return {
      isFinal: this.esFinal(quiz),
      score: nota,
      passed: aprobado,
      passingScore: quiz.passingScore,
      correctCount: correctas,
      totalQuestions: total,
      bestScore: mejor.bestScore,
      attempts: mejor.attempts,
      results: resultados,
    };
  }

  // ── Admin ───────────────────────────────────────────────────────────────
  async adminList(courseId: string) {
    const lista = await this.quizzes.find({
      where: { courseId },
      relations: { questions: true },
      order: { createdAt: 'ASC', questions: { orderNumber: 'ASC' } },
    });
    const stats: { quizId: string; intentos: number; alumnos: number; promedio: number; aprobados: number }[] =
      await this.db.query(
        `SELECT "quizId", COUNT(*)::int AS intentos, COUNT(DISTINCT "userId")::int AS alumnos,
                COALESCE(ROUND(AVG(score)), 0)::int AS promedio,
                COUNT(DISTINCT "userId") FILTER (WHERE passed)::int AS aprobados
           FROM quiz_attempts a JOIN quizzes q ON q.id = a."quizId"
          WHERE q."courseId" = $1 GROUP BY "quizId"`,
        [courseId],
      );
    const porQuiz = new Map(stats.map((s) => [s.quizId, s]));
    return lista.map((q) => ({
      id: q.id,
      courseId: q.courseId,
      moduleId: q.moduleId,
      lessonId: q.lessonId,
      title: q.title,
      description: q.description,
      passingScore: q.passingScore,
      published: q.published,
      isFinal: this.esFinal(q),
      questions: q.questions.map((p) => ({
        id: p.id, text: p.text, options: p.options, correctIndex: p.correctIndex, explanation: p.explanation,
      })),
      stats: porQuiz.get(q.id) ?? { intentos: 0, alumnos: 0, promedio: 0, aprobados: 0 },
    }));
  }

  private async validarUbicacion(dto: SaveQuizDto, id?: string) {
    const tieneModulo = !!dto.moduleId;
    const tieneLeccion = !!dto.lessonId;
    if (dto.final) {
      if (tieneModulo || tieneLeccion) {
        throw new BadRequestException('El examen final no va en un módulo ni en una lección');
      }
      const [otro] = await this.db.query(
        `SELECT id FROM quizzes WHERE "courseId" = $1 AND "moduleId" IS NULL AND "lessonId" IS NULL AND id <> COALESCE($2::uuid, '00000000-0000-0000-0000-000000000000'::uuid)`,
        [dto.courseId, id ?? null],
      );
      if (otro) throw new BadRequestException('Este curso ya tiene un examen final. Edítalo en lugar de crear otro.');
      const [c] = await this.db.query(`SELECT 1 FROM courses WHERE id = $1`, [dto.courseId]);
      if (!c) throw new BadRequestException('Curso no encontrado');
    } else if (tieneModulo === tieneLeccion) {
      throw new BadRequestException('Elige si el cuestionario va al final de un módulo o después de una lección');
    }
    if (dto.final) {
      // ubicación ya validada
    } else if (tieneModulo) {
      const [m] = await this.db.query(`SELECT 1 FROM modules WHERE id = $1 AND "courseId" = $2`, [dto.moduleId, dto.courseId]);
      if (!m) throw new BadRequestException('El módulo no pertenece a este curso');
    } else {
      const [l] = await this.db.query(
        `SELECT 1 FROM lessons l JOIN modules m ON m.id = l."moduleId" WHERE l.id = $1 AND m."courseId" = $2`,
        [dto.lessonId, dto.courseId],
      );
      if (!l) throw new BadRequestException('La lección no pertenece a este curso');
    }
    dto.questions.forEach((p, i) => {
      const opciones = p.options.map((o) => o.trim());
      if (opciones.some((o) => !o)) throw new BadRequestException(`La pregunta ${i + 1} tiene una opción vacía`);
      if (new Set(opciones.map((o) => o.toLowerCase())).size !== opciones.length) {
        throw new BadRequestException(`La pregunta ${i + 1} tiene opciones repetidas`);
      }
      if (p.correctIndex >= opciones.length) {
        throw new BadRequestException(`Marca la respuesta correcta de la pregunta ${i + 1}`);
      }
    });
  }

  async save(dto: SaveQuizDto, id?: string) {
    await this.validarUbicacion(dto, id);
    return this.db.transaction(async (m) => {
      let quiz: Quiz | null;
      if (id) {
        quiz = await m.findOne(Quiz, { where: { id } });
        if (!quiz) throw new NotFoundException('Cuestionario no encontrado');
        if (quiz.courseId !== dto.courseId) throw new BadRequestException('El cuestionario es de otro curso');
        await m.delete(QuizQuestion, { quizId: id });
      } else {
        quiz = m.create(Quiz, { courseId: dto.courseId });
      }
      quiz.moduleId = dto.final ? null : dto.moduleId || null;
      quiz.lessonId = dto.final ? null : dto.lessonId || null;
      quiz.title = dto.title.trim();
      quiz.description = dto.description?.trim() || null;
      quiz.passingScore = dto.passingScore;
      quiz.published = dto.published ?? true;
      quiz = await m.save(Quiz, quiz);
      const preguntas = dto.questions.map((p, i) =>
        m.create(QuizQuestion, {
          quizId: quiz!.id,
          text: p.text.trim(),
          options: p.options.map((o) => o.trim()),
          correctIndex: p.correctIndex,
          explanation: p.explanation?.trim() || null,
          orderNumber: i + 1,
        }),
      );
      await m.save(QuizQuestion, preguntas);
      return { id: quiz.id };
    });
  }

  async remove(id: string) {
    const r = await this.quizzes.delete({ id });
    if (!r.affected) throw new NotFoundException('Cuestionario no encontrado');
    return { id, eliminado: true };
  }
}
