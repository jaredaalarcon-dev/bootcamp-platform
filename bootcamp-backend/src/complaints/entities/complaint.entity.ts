// src/complaints/entities/complaint.entity.ts
// Hoja de reclamación del Libro de Reclamaciones virtual
// (Código de Protección y Defensa del Consumidor, D.S. 011-2011-PCM y modificatorias).
import { Entity, Column, Generated, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export const TIPOS_RECLAMO = ['reclamo', 'queja'] as const;
export type TipoReclamo = (typeof TIPOS_RECLAMO)[number];
export const TIPOS_BIEN = ['servicio', 'producto'] as const;
export type TipoBien = (typeof TIPOS_BIEN)[number];
export type EstadoReclamo = 'pendiente' | 'respondido';

@Entity('complaints')
export class Complaint extends BaseEntity {
  // Número correlativo de la hoja (1, 2, 3…)
  @Index({ unique: true })
  @Column()
  @Generated('increment')
  numero: number;

  // Código visible: LR-2026-000001
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20, nullable: true })
  code: string | null;

  // ── Consumidor ──
  @Column({ type: 'varchar', length: 150 })
  fullName: string;

  @Column({ type: 'varchar', length: 20 })
  documentType: string;

  @Column({ type: 'varchar', length: 20 })
  documentNumber: string;

  @Column({ type: 'varchar', length: 250 })
  address: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'varchar', length: 150 })
  email: string;

  @Column({ type: 'boolean', default: false })
  isMinor: boolean;

  // Padre, madre o apoderado (si el consumidor es menor de edad)
  @Column({ type: 'varchar', length: 150, nullable: true })
  guardianName: string | null;

  // ── Bien contratado ──
  @Column({ type: 'varchar', length: 20 })
  itemType: TipoBien;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  amount: string | null;

  @Column({ type: 'text' })
  itemDescription: string;

  // ── Detalle ──
  @Column({ type: 'varchar', length: 20 })
  type: TipoReclamo;

  @Column({ type: 'text' })
  detail: string;

  @Column({ type: 'text' })
  request: string;

  // ── Atención del proveedor ──
  @Column({ type: 'varchar', length: 20, default: 'pendiente' })
  status: EstadoReclamo;

  @Column({ type: 'text', nullable: true })
  response: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  respondedAt: Date | null;

  // Usuario de la plataforma, si estaba con sesión iniciada (opcional)
  @Column({ type: 'varchar', length: 64, nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  userAgent: string | null;
}
