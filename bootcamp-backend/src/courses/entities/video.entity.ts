import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Lesson } from './lesson.entity';

@Entity('videos')
export class Video extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  videoUrl: string;

  @Column({ type: 'int', nullable: true })
  duration: number;

  @OneToOne(() => Lesson, (lesson) => lesson.video, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'lessonId' })
  lesson: Lesson;
}
