// src/blog/entities/blog-post.entity.ts
// Publicación del blog: enlaza a un post de una red social de la empresa
// (Facebook, Instagram, TikTok, LinkedIn…) o a una noticia propia.
import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export const REDES_BLOG = [
  'facebook',
  'instagram',
  'youtube',
  'tiktok',
  'linkedin',
  'github',
  'noticia',
] as const;
export type RedBlog = (typeof REDES_BLOG)[number];

@Entity('blog_posts')
export class BlogPost extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({ type: 'varchar', length: 20, default: 'noticia' })
  network: RedBlog;

  // Etiqueta libre: Tecnología, Cursos, Consejos, Eventos…
  @Column({ type: 'varchar', length: 50, nullable: true })
  category: string | null;

  @Column({ type: 'text', nullable: true })
  imageUrl: string | null;

  // Enlace a la publicación original
  @Column({ type: 'text' })
  url: string;

  @Index()
  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  publishedAt: Date;

  @Column({ type: 'boolean', default: true })
  isPublished: boolean;
}
