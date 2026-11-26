// src/quizzes/entities/quiz.entity.ts
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Module as ModuleEntity } from '../../courses/entities/module.entity';
import { Lesson } from '../../courses/entities/lesson.entity';
import { QuizQuestion } from './quiz-question.entity';

// Cuestionario. Va al final de un módulo (moduleId) o después de una lección (lessonId).
@Entity('quizzes')
@Index('IDX_quizzes_course', ['courseId'])
export class Quiz extends BaseEntity {
  @Column({ type: 'uuid' })
  courseId: string;

  @Column({ type: 'uuid', nullable: true })
  moduleId: string | null;

  @ManyToOne(() => ModuleEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'moduleId' })
  module: ModuleEntity | null;

  @Column({ type: 'uuid', nullable: true })
  lessonId: string | null;

  @ManyToOne(() => Lesson, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'lessonId' })
  lesson: Lesson | null;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // Nota mínima para aprobar (0 a 100)
  @Column({ type: 'smallint', default: 70 })
  passingScore: number;

  // Si está apagado, los alumnos no lo ven
  @Column({ type: 'boolean', default: true })
  published: boolean;

  @OneToMany(() => QuizQuestion, (q) => q.quiz, { cascade: true })
  questions: QuizQuestion[];
}
