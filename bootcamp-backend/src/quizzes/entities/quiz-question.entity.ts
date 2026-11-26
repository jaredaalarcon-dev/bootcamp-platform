// src/quizzes/entities/quiz-question.entity.ts
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Quiz } from './quiz.entity';

@Entity('quiz_questions')
export class QuizQuestion extends BaseEntity {
  @Column({ type: 'uuid' })
  quizId: string;

  @ManyToOne(() => Quiz, (q) => q.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;

  @Column({ type: 'text' })
  text: string;

  // Opciones de respuesta (de 2 a 6)
  @Column({ type: 'jsonb' })
  options: string[];

  // Posición de la opción correcta dentro de "options"
  @Column({ type: 'smallint' })
  correctIndex: number;

  // Se muestra al alumno después de responder
  @Column({ type: 'text', nullable: true })
  explanation: string | null;

  @Column({ type: 'int', default: 0 })
  orderNumber: number;
}
