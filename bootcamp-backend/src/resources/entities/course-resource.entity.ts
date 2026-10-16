// src/resources/entities/course-resource.entity.ts
// Material de apoyo de un curso: guías, ejercicios, lecturas, plantillas o enlaces.
import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Course } from '../../courses/entities/course.entity';

export const TIPOS_RECURSO = [
  'guia',
  'ejercicio',
  'lectura',
  'plantilla',
  'enlace',
  'otro',
] as const;
export type TipoRecurso = (typeof TIPOS_RECURSO)[number];

@Entity('course_resources')
export class CourseResource extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 30, default: 'guia' })
  type: TipoRecurso;

  // Enlace externo (Drive, GitHub, web). Vacío si el recurso es un archivo subido.
  @Column({ type: 'text', nullable: true })
  externalUrl: string | null;

  // Ruta del archivo dentro del bucket privado de Supabase Storage.
  @Column({ type: 'text', nullable: true })
  storagePath: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fileName: string | null;

  @Column({ type: 'int', nullable: true })
  fileSize: number | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  mimeType: string | null;

  @Column({ type: 'int', default: 0 })
  orderNumber: number;

  @Index()
  @Column('uuid')
  courseId: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: Course;
}
