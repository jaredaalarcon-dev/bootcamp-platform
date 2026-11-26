// src/quizzes/entities/quiz-attempt.entity.ts
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Quiz } from './quiz.entity';

// Cada vez que un alumno envía un cuestionario
@Entity('quiz_attempts')
@Index('IDX_quiz_attempts_user_quiz', ['userId', 'quizId'])
export class QuizAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  quizId: string;

  @ManyToOne(() => Quiz, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;

  @Column({ type: 'uuid' })
  userId: string;

  // Nota de 0 a 100
  @Column({ type: 'smallint' })
  score: number;

  @Column({ type: 'smallint' })
  correctCount: number;

  @Column({ type: 'smallint' })
  totalQuestions: number;

  @Column({ type: 'boolean' })
  passed: boolean;

  // Respuestas elegidas: { [idPregunta]: índice }
  @Column({ type: 'jsonb' })
  answers: Record<string, number>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
