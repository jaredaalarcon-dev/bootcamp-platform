// src/quizzes/quizzes.service.ts — cuestionarios por módulo o por lección
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Quiz } from './entities/quiz.entity';
import { QuizQuestion } from './entities/quiz-question.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';
import { SaveQuizDto } from './dto/quiz.dto';
import { estaInscrito } from '../community/community.helpers';

const INTENTOS_POR_HORA = 20;

@Injectable()
export class QuizzesService {
  constructor(
    @InjectRepository(Quiz) private readonly quizzes: Repository<Quiz>,
    @InjectRepository(QuizAttempt) private readonly attempts: Repository<QuizAttempt>,
    @InjectDataSource() private readonly db: DataSource,
  ) {}

  // ── Alumno ──────────────────────────────────────────────────────────────
  /** Cuestionarios publicados del curso, con mi mejor nota en cada uno. */
  async listForCourse(userId: string, courseId: string) {
    const filas = await this.db.query(
      `SELECT q.id, q.title, q.description, q."moduleId", q."lessonId", q."passingScore",
              (SELECT COUNT(*)::int FROM quiz_questions qq WHERE qq."quizId" = q.id) AS "questionCount",
              (SELECT MAX(a.score)::int FROM quiz_attempts a WHERE a."quizId" = q.id AND a."userId" = $2) AS "bestScore",
              (SELECT COUNT(*)::int FROM quiz_attempts a WHERE a."quizId" = q.id AND a."userId" = $2) AS attempts,
              EXISTS (SELECT 1 FROM quiz_attempts a WHERE a."quizId" = q.id AND a."userId" = $2 AND a.passed) AS passed
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
    return {
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
      questions: q.questions.map((p) => ({
        id: p.id, text: p.text, options: p.options, correctIndex: p.correctIndex, explanation: p.explanation,
      })),
      stats: porQuiz.get(q.id) ?? { intentos: 0, alumnos: 0, promedio: 0, aprobados: 0 },
    }));
  }

  private async validarUbicacion(dto: SaveQuizDto) {
    const tieneModulo = !!dto.moduleId;
    const tieneLeccion = !!dto.lessonId;
    if (tieneModulo === tieneLeccion) {
      throw new BadRequestException('Elige si el cuestionario va al final de un módulo o después de una lección');
    }
    if (tieneModulo) {
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
    await this.validarUbicacion(dto);
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
      quiz.moduleId = dto.moduleId || null;
      quiz.lessonId = dto.lessonId || null;
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
