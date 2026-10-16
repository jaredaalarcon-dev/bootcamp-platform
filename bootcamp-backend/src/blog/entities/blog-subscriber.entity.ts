// src/blog/entities/blog-subscriber.entity.ts
import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('blog_subscribers')
export class BlogSubscriber extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email: string;
}
