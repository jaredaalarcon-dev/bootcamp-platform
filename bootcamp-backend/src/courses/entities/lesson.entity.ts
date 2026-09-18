import { Entity, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Module } from './module.entity';
import { Video } from './video.entity';

@Entity('lessons')
export class Lesson extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int' })
  orderNumber: number;

  @ManyToOne(() => Module, (module) => module.lessons, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'moduleId' })
  module: Module;

  @OneToOne(() => Video, (video) => video.lesson, {
    cascade: true,
  })
  video: Video;
}
