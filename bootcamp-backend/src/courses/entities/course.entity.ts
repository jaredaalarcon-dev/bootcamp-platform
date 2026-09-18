import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Category } from './category.entity';
import { Module as ModuleEntity } from './module.entity';
import { Enrollment } from '../../enrollments/entities/enrollment.entity';

@Entity('courses')
export class Course extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  image: string;

  @Column({ type: 'varchar', length: 50, default: 'draft' })
  status: string;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @OneToMany(() => ModuleEntity, (module) => module.course, {
    cascade: true,
  })
  modules: ModuleEntity[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.course, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  enrollments: Enrollment[];
}
