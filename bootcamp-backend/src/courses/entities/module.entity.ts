import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Course } from './course.entity';
import { Lesson } from './lesson.entity';

@Entity('modules')
export class Module extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int' })
  orderNumber: number;

  @ManyToOne(() => Course, (course) => course.modules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @OneToMany(() => Lesson, (lesson) => lesson.module, {
    cascade: true,
  })
  lessons: Lesson[];
}
