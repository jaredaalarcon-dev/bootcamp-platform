// src/community/entities/lesson-question.entity.ts
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Lesson } from '../../courses/entities/lesson.entity';

// Pregunta o comentario de un alumno en una lección. El admin la responde.
@Entity('lesson_questions')
@Index('IDX_lesson_questions_lesson', ['lessonId', 'createdAt'])
@Index('IDX_lesson_questions_status', ['answeredAt', 'createdAt'])
export class LessonQuestion extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  lessonId: string;

  @ManyToOne(() => Lesson, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lessonId' })
  lesson: Lesson;

  // Copia del curso para filtrar rápido en el panel admin
  @Column({ type: 'uuid' })
  courseId: string;

  @Column({ type: 'varchar', length: 120 })
  authorName: string;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'text', nullable: true })
  answer: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  answeredAt: Date | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  answeredBy: string | null;
}
