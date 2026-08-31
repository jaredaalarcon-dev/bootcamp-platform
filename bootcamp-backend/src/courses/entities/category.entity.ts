import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('categories')
export class Category extends BaseEntity {
  @Column({ type: 'varchar', length: 150, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;
}