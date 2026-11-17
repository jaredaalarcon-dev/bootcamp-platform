// src/assistant/entities/assistant-faq.entity.ts
// Preguntas frecuentes que el admin crea desde el panel. El chatbot las
// reconoce aunque estén escritas de otra forma y responde sin usar IA.
import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('assistant_faqs')
export class AssistantFaq extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  question: string;

  // Otras formas de preguntar lo mismo (una por línea)
  @Column({ type: 'text', default: '' })
  variants: string;

  @Column({ type: 'text' })
  answer: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  // Cuántas veces se usó esta respuesta
  @Column({ type: 'int', default: 0 })
  hits: number;
}
