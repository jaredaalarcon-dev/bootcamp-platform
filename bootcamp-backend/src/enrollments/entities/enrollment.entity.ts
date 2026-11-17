// src/enrollments/entities/enrollment.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Course } from '../../courses/entities/course.entity';

// Un usuario no puede inscribirse dos veces al mismo curso.
// La base de datos lo impide aunque lleguen dos peticiones a la vez.
@Entity('enrollments')
@Unique('UQ_enrollment_user_course', ['userId', 'courseId'])
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'in_progress' })
  status: string;

  @CreateDateColumn()
  enrolledAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Pago del certificado. Se coordina por WhatsApp y el admin lo marca aquí.
  // Sin pago el alumno recibe una constancia gratuita; con pago, el certificado.
  @Column({ type: 'boolean', default: false })
  paid: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  paidAt: Date | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  paymentNote: string | null;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  courseId: string;

  @ManyToOne(() => Course, (course) => course.enrollments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'courseId' })
  course: Course;
}
