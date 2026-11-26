// src/notifications/entities/notification.entity.ts
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type TipoNotificacion = 'curso_nuevo' | 'certificado' | 'constancia' | 'respuesta' | 'general';

// Avisos para el alumno. Cada fila pertenece a un usuario (id de Supabase Auth).
// "key" evita duplicados: el mismo aviso con la misma clave no se repite.
@Entity('notifications')
@Index('IDX_notifications_user_created', ['userId', 'createdAt'])
@Index('UQ_notifications_user_key', ['userId', 'key'], { unique: true, where: '"key" IS NOT NULL' })
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 30, default: 'general' })
  type: TipoNotificacion;

  @Column({ type: 'varchar', length: 160 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  link: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  key: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  readAt: Date | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
