// src/assistant/entities/assistant-setting.entity.ts
// Configuración editable desde el admin (una sola fila, id = 'main').
import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('assistant_settings')
export class AssistantSetting {
  @PrimaryColumn({ type: 'varchar', length: 20 })
  id: string;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  // Preguntas frecuentes e información del negocio que la IA debe conocer
  @Column({ type: 'text' })
  knowledge: string;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
