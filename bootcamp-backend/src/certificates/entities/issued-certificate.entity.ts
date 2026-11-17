// src/certificates/entities/issued-certificate.entity.ts
// Registro de cada certificado o constancia emitida. Permite que cualquiera
// verifique un documento con su código en /verificar/<código>.
import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export const TIPOS_DOCUMENTO_EMITIDO = ['certificado', 'constancia'] as const;
export type TipoEmitido = (typeof TIPOS_DOCUMENTO_EMITIDO)[number];

@Entity('issued_certificates')
@Index(['userId', 'courseId', 'type'], { unique: true })
export class IssuedCertificate extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 32 })
  code: string;

  @Column({ type: 'varchar', length: 20 })
  type: TipoEmitido;

  @Column({ type: 'varchar', length: 64 })
  userId: string;

  @Column('uuid')
  courseId: string;

  // Copia de los datos al momento de emitir (el documento no cambia después)
  @Column({ type: 'varchar', length: 150 })
  studentName: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  documentLabel: string | null;

  @Column({ type: 'varchar', length: 200 })
  courseName: string;

  // Fecha en que el alumno terminó el curso
  @Column({ type: 'timestamp with time zone' })
  completedAt: Date;

  @Column({ type: 'boolean', default: false })
  revoked: boolean;
}
