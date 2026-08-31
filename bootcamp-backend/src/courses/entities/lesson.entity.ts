import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Module } from './module.entity';

@Entity('lessons')
export class Lesson extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int' })
  orderNumber: number;

  @ManyToOne(() => Module)
  @JoinColumn({ name: 'moduleId' })
  module: Module;
}