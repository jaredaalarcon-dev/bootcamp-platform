// src/community/entities/course-review.entity.ts
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Course } from '../../courses/entities/course.entity';

// Calificación (1 a 5 estrellas) y reseña de un alumno. Una por alumno y curso.
@Entity('course_reviews')
@Unique('UQ_course_review_user_course', ['userId', 'courseId'])
@Index('IDX_course_reviews_course', ['courseId', 'createdAt'])
export class CourseReview extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  courseId: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column({ type: 'varchar', length: 120 })
  authorName: string;

  @Column({ type: 'smallint' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  // El admin puede ocultar una reseña inapropiada sin borrarla
  @Column({ type: 'boolean', default: false })
  hidden: boolean;
}
