// src/legal/entities/terms-acceptance.entity.ts
// Registro de cada aceptación de los Términos y la Política de Privacidad
// (prueba del consentimiento: quién, qué versión, cuándo y desde dónde).
import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('terms_acceptances')
@Index(['userId', 'version'])
export class TermsAcceptance extends BaseEntity {
  // id del usuario en Supabase Auth (el "sub" del JWT)
  @Column({ type: 'varchar', length: 64 })
  userId: string;

  @Column({ type: 'varchar', length: 20 })
  version: string;

  // 'registro' o 'inicio_sesion'
  @Column({ type: 'varchar', length: 20 })
  source: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  userAgent: string | null;
}
