// src/certificates/entities/certificate-profile.entity.ts
// Datos que el alumno registra para que salgan en su certificado:
// nombre completo tal como figura en su documento, documento y foto formal.
import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export const TIPOS_DOCUMENTO = ['DNI', 'CE', 'PASAPORTE'] as const;
export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];

@Entity('certificate_profiles')
export class CertificateProfile extends BaseEntity {
  // id del usuario en Supabase Auth (el "sub" del JWT)
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  userId: string;

  @Column({ type: 'varchar', length: 150 })
  fullName: string;

  @Column({ type: 'varchar', length: 20, default: 'DNI' })
  documentType: TipoDocumento;

  @Column({ type: 'varchar', length: 20 })
  documentNumber: string;

  // Ruta de la foto dentro del bucket privado "certificate-photos"
  @Column({ type: 'varchar', length: 255, nullable: true })
  photoPath: string | null;
}
