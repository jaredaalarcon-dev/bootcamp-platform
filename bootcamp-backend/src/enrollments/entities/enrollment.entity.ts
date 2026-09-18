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
