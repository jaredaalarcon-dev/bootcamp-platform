// src/progress/entities/progress.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Lesson } from '../../courses/entities/lesson.entity';

// Una sola fila por usuario y lección
@Entity('progress')
@Unique('UQ_progress_user_lesson', ['userId', 'lessonId'])
export class Progress extends BaseEntity {
  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string;

  @Column({ type: 'int', default: 0 })
  watchedTime: number;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  // Guardamos el id de Supabase Auth, igual que hace Enrollment.
  // No usamos una relación con Profile porque esa tabla la maneja
  // Supabase con nombres en snake_case y TypeORM intentaría alterarla.
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  lessonId: string;

  @ManyToOne(() => Lesson, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lessonId' })
  lesson: Lesson;
}
