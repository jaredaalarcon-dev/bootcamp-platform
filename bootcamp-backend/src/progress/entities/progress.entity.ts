import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Profile } from '../../users/entities/profile.entity';
import { Lesson } from '../../courses/entities/lesson.entity';

@Entity('progress')
export class Progress extends BaseEntity {
  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string;

  @Column({ type: 'int', default: 0 })
  watchedTime: number;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @ManyToOne(() => Profile)
  @JoinColumn({ name: 'userId' })
  user: Profile;

  @ManyToOne(() => Lesson)
  @JoinColumn({ name: 'lessonId' })
  lesson: Lesson;
}
