import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Profile } from '../../users/entities/profile.entity';
import { Course } from '../../courses/entities/course.entity';

@Entity('enrollments')
export class Enrollment extends BaseEntity {
  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @ManyToOne(() => Profile)
  @JoinColumn({ name: 'userId' })
  user: Profile;

  @ManyToOne(() => Course)
  @JoinColumn({ name: 'courseId' })
  course: Course;
}
