// src/assistant/entities/assistant-message.entity.ts
// Cada mensaje de una conversación con JB Assist (web o WhatsApp).
import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export const CANALES_ASISTENTE = ['web', 'whatsapp'] as const;
export type CanalAsistente = (typeof CANALES_ASISTENTE)[number];

@Entity('assistant_messages')
export class AssistantMessage extends BaseEntity {
  // Web: id aleatorio que guarda el navegador. WhatsApp: número del cliente.
  @Index()
  @Column({ type: 'varchar', length: 80 })
  conversationId: string;

  @Column({ type: 'varchar', length: 20, default: 'web' })
  channel: CanalAsistente;

  // 'user' = la persona, 'assistant' = JB Assist
  @Column({ type: 'varchar', length: 20 })
  role: 'user' | 'assistant';

  @Column({ type: 'text' })
  content: string;

  // Quién respondió: bot (tema fijo), faq, curso, cache, gemini, groq o fallback.
  @Column({ type: 'varchar', length: 30, nullable: true })
  provider: string | null;

  // Tema que detectó el chatbot (para el reporte y las "preguntas sin respuesta")
  @Column({ type: 'varchar', length: 60, nullable: true })
  intent: string | null;
}
