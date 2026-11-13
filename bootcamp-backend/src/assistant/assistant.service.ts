// src/assistant/assistant.service.ts
// El "cerebro" de JB Assist: arma el contexto (cursos reales + información
// del negocio), recuerda la conversación y le pregunta a la IA.
// Lo usan el chat de la plataforma y, más adelante, WhatsApp.
import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AssistantMessage, CanalAsistente } from './entities/assistant-message.entity';
import { AssistantSetting } from './entities/assistant-setting.entity';
import { ErrorIA, preguntarGemini, preguntarGroq, RespuestaIA, Turno } from './ai-providers';

export const ASSISTANT_NAME = 'JB Assist';

// Cuántos mensajes anteriores recuerda en cada respuesta
const MEMORIA = 12;
// Límites para cuidar la cuota gratuita
const POR_MINUTO_CONVERSACION = 8;
const POR_MINUTO_IP = 20;

const CONOCIMIENTO_INICIAL = `EMPRESA
Soluciones Integrales JB S.A.C. — "Tu mejor opción tecnológica". Empresa peruana de tecnología.

PLATAFORMA BOOTCAMP
- Cursos virtuales de tecnología que el alumno avanza a su propio ritmo.
- Cada curso tiene módulos y lecciones en video; el avance se guarda automáticamente.
- Al completar el 100% de un curso, el alumno obtiene su certificado en la sección "Certificados".
- Los alumnos inscritos encuentran guías, bibliografía y ejercicios en la pestaña "Recursos" de cada curso.

CÓMO EMPEZAR
1. Crear una cuenta gratis en la página "Registrarse".
2. Entrar a "Explorar cursos", elegir un curso y pulsar "Inscribirme".
3. El curso aparece en "Mis cursos" para continuar cuando quieras.

CONTACTO
- Correo: consultas@solucionesintegralesjb.com
- WhatsApp: +51 926 392 858
- Facebook, Instagram, TikTok y YouTube: Soluciones Integrales JB

PRECIOS Y HORARIOS DE ATENCIÓN
(Completar desde el panel admin. Mientras no estén aquí, JB Assist deriva esas preguntas al equipo.)`;

@Injectable()
export class AssistantService implements OnModuleInit {
  private readonly log = new Logger('JB Assist');
  private catalogo: { texto: string; hasta: number } | null = null;
  private golpes = new Map<string, number[]>();

  constructor(
    @InjectRepository(AssistantMessage) private mensajes: Repository<AssistantMessage>,
    @InjectRepository(AssistantSetting) private ajustes: Repository<AssistantSetting>,
    @InjectDataSource() private db: DataSource,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    // Crea la configuración inicial la primera vez
    try {
      const existe = await this.ajustes.findOne({ where: { id: 'main' } });
      if (!existe) await this.ajustes.save({ id: 'main', enabled: true, knowledge: CONOCIMIENTO_INICIAL });
    } catch (e) {
      this.log.warn(`No se pudo preparar la configuración: ${(e as Error).message}`);
    }
  }

  // ── Configuración ────────────────────────────────────────────────────────
  private get gemini() {
    // Si el modelo principal está saturado, prueba los siguientes (todos gratis)
    const principal = this.config.get<string>('GEMINI_MODEL') || 'gemini-flash-latest';
    const extra = (this.config.get<string>('GEMINI_FALLBACK_MODELS') || 'gemini-flash-lite-latest')
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);
    return {
      key: this.config.get<string>('GEMINI_API_KEY') ?? '',
      model: principal,
      models: [...new Set([principal, ...extra])],
    };
  }
  private get groq() {
    return {
      key: this.config.get<string>('GROQ_API_KEY') ?? '',
      model: this.config.get<string>('GROQ_MODEL') || 'llama-3.3-70b-versatile',
    };
  }

  async getSettings() {
    return (
      (await this.ajustes.findOne({ where: { id: 'main' } })) ?? {
        id: 'main',
        enabled: true,
        knowledge: CONOCIMIENTO_INICIAL,
        updatedAt: new Date(),
      }
    );
  }

  async updateSettings(datos: { enabled?: boolean; knowledge?: string }) {
    const actual = await this.getSettings();
    return this.ajustes.save({ ...actual, ...datos, id: 'main' });
  }

  async status() {
    const s = await this.getSettings();
    const configurado = !!(this.gemini.key || this.groq.key);
    return { name: ASSISTANT_NAME, enabled: s.enabled && configurado, configured: configurado };
  }

  // ── Conversación ─────────────────────────────────────────────────────────
  async chat(opts: {
    conversationId: string;
    channel: CanalAsistente;
    message: string;
    userName?: string;
    ip?: string;
  }) {
    const texto = opts.message.trim();
    const ajustes = await this.getSettings();
    if (!ajustes.enabled) throw new ServiceUnavailableException(`${ASSISTANT_NAME} está desactivado por el momento.`);
    if (!this.gemini.key && !this.groq.key) {
      throw new ServiceUnavailableException(`${ASSISTANT_NAME} aún no está configurado (falta GEMINI_API_KEY en el .env).`);
    }
    this.limitar(`c:${opts.conversationId}`, POR_MINUTO_CONVERSACION);
    if (opts.ip) this.limitar(`ip:${opts.ip}`, POR_MINUTO_IP);

    // Memoria: últimos mensajes de esta conversación
    const previos = await this.mensajes.find({
      where: { conversationId: opts.conversationId },
      order: { createdAt: 'DESC' },
      take: MEMORIA,
    });
    const turnos: Turno[] = previos.reverse().map((m) => ({ role: m.role, content: m.content }));
    // La conversación siempre debe empezar con la persona
    while (turnos.length && turnos[0].role !== 'user') turnos.shift();
    turnos.push({ role: 'user', content: texto });

    const system = await this.systemPrompt(ajustes.knowledge, opts.channel, opts.userName);
    const respuesta = await this.preguntar(system, turnos);

    await this.mensajes.save([
      this.mensajes.create({ conversationId: opts.conversationId, channel: opts.channel, role: 'user', content: texto, provider: null }),
      this.mensajes.create({ conversationId: opts.conversationId, channel: opts.channel, role: 'assistant', content: respuesta.text, provider: respuesta.provider }),
    ]);
    return { reply: respuesta.text, provider: respuesta.provider, conversationId: opts.conversationId };
  }

  async history(conversationId: string) {
    const lista = await this.mensajes.find({
      where: { conversationId },
      order: { createdAt: 'DESC' },
      take: 30,
    });
    return lista.reverse().map((m) => ({ role: m.role, content: m.content, createdAt: m.createdAt }));
  }

  // ── Admin: conversaciones ────────────────────────────────────────────────
  async conversations() {
    return this.db.query(
      `SELECT "conversationId", MAX(channel) AS channel, COUNT(*)::int AS messages,
              MIN("createdAt") AS "startedAt", MAX("createdAt") AS "lastAt",
              (ARRAY_AGG(content ORDER BY "createdAt" ASC) FILTER (WHERE role = 'user'))[1] AS "firstMessage"
         FROM assistant_messages
        GROUP BY "conversationId"
        ORDER BY MAX("createdAt") DESC
        LIMIT 100`,
    );
  }

  async conversation(conversationId: string) {
    const lista = await this.mensajes.find({ where: { conversationId }, order: { createdAt: 'ASC' } });
    if (!lista.length) throw new NotFoundException('Conversación no encontrada');
    return lista.map((m) => ({ role: m.role, content: m.content, provider: m.provider, createdAt: m.createdAt }));
  }

  // ── Internos ─────────────────────────────────────────────────────────────
  private async preguntar(system: string, turnos: Turno[]): Promise<RespuestaIA> {
    const errores: string[] = [];
    const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

    if (this.gemini.key) {
      for (const modelo of this.gemini.models) {
        // Hasta 2 intentos por modelo cuando el error es temporal (saturado, cuota…)
        for (let intento = 1; intento <= 2; intento++) {
          try {
            return await preguntarGemini(this.gemini.key, modelo, system, turnos);
          } catch (e) {
            const err = e as Error;
            errores.push(err.message);
            const temporal = err instanceof ErrorIA ? err.temporal : true; // red caída = temporal
            if (!temporal) break; // clave o modelo inválido: no insistir con este modelo
            if (intento === 1) await esperar(1200);
          }
        }
      }
    }
    if (this.groq.key) {
      try {
        return await preguntarGroq(this.groq.key, this.groq.model, system, turnos);
      } catch (e) {
        errores.push((e as Error).message);
      }
    }
    this.log.error(`Ninguna IA respondió: ${errores.join(' | ')}`);
    throw new ServiceUnavailableException(
      `${ASSISTANT_NAME} no pudo responder ahora. Intenta en un momento o escríbenos por WhatsApp al +51 926 392 858.`,
    );
  }

  private limitar(clave: string, maximo: number) {
    const ahora = Date.now();
    const lista = (this.golpes.get(clave) ?? []).filter((t) => ahora - t < 60_000);
    if (lista.length >= maximo) {
      throw new HttpException('Vas muy rápido 🙂 Espera unos segundos y vuelve a escribir.', HttpStatus.TOO_MANY_REQUESTS);
    }
    lista.push(ahora);
    this.golpes.set(clave, lista);
    if (this.golpes.size > 5000) this.golpes.clear(); // evita que crezca sin fin
  }

  /** Cursos publicados, leídos de la base de datos (se refresca cada 5 min). */
  private async cursos(): Promise<string> {
    if (this.catalogo && this.catalogo.hasta > Date.now()) return this.catalogo.texto;
    let texto = 'Por ahora no hay cursos publicados.';
    try {
      const filas: any[] = await this.db.query(
        `SELECT c.title, c.description, cat.name AS category,
                COUNT(DISTINCT m.id)::int AS modules, COUNT(l.id)::int AS lessons
           FROM courses c
           LEFT JOIN categories cat ON cat.id = c."categoryId"
           LEFT JOIN modules m ON m."courseId" = c.id
           LEFT JOIN lessons l ON l."moduleId" = m.id
          WHERE c.status = 'published'
          GROUP BY c.id, cat.name
          ORDER BY c.title`,
      );
      if (filas.length) {
        texto = filas
          .map((c) => {
            const desc = String(c.description ?? '').replace(/\s+/g, ' ').slice(0, 280);
            return `- ${c.title} (${c.category || 'General'}; ${c.modules} módulos, ${c.lessons} lecciones): ${desc}`;
          })
          .join('\n');
      }
    } catch (e) {
      this.log.warn(`No se pudo leer el catálogo: ${(e as Error).message}`);
    }
    this.catalogo = { texto, hasta: Date.now() + 5 * 60_000 };
    return texto;
  }

  private async systemPrompt(conocimiento: string, canal: CanalAsistente, userName?: string) {
    const formato =
      canal === 'whatsapp'
        ? 'Estás respondiendo por WhatsApp: usa *negritas* con asteriscos simples, nada de títulos ni tablas, máximo unas 6 líneas.'
        : 'Estás en el chat de la plataforma web: puedes usar listas cortas con guiones y **negritas** con moderación.';
    const nombre = userName?.trim()
      ? `La persona con la que hablas se llama ${userName.trim().slice(0, 60)}; llámala por su nombre de vez en cuando.`
      : 'No sabes el nombre de la persona; si es natural, puedes preguntárselo una sola vez.';

    return `Eres ${ASSISTANT_NAME}, el asistente virtual de la plataforma Bootcamp de Soluciones Integrales JB.
Tu trabajo: orientar a visitantes y alumnos sobre los cursos, cómo inscribirse, cómo usar la plataforma, certificados y contacto, y resolver dudas técnicas básicas relacionadas con los temas de los cursos.

ESTILO
- Español neutro y cercano (público peruano), amable y profesional. Tutea.
- Respuestas breves y claras: normalmente 2 a 5 oraciones. Ve al grano.
- ${formato}
- ${nombre}

REGLAS
- Usa SOLO la información de abajo para datos del negocio (cursos, precios, horarios, contacto). Si algo no está, dilo con honestidad y ofrece el WhatsApp +51 926 392 858 o el correo consultas@solucionesintegralesjb.com. Nunca inventes precios, fechas, descuentos ni cursos.
- Si preguntan algo fuera de tema (política, temas personales, tareas que no son de tecnología), responde con amabilidad que solo puedes ayudar con la plataforma y con tecnología.
- No pidas datos sensibles (DNI, tarjetas, contraseñas). Si alguien comparte una contraseña, recomiéndale cambiarla.
- No digas que eres un modelo de Google, Meta u otra empresa; eres ${ASSISTANT_NAME}.
- Si la persona quiere hablar con un humano, dale el WhatsApp +51 926 392 858.

CURSOS PUBLICADOS (datos reales de la plataforma)
${await this.cursos()}

INFORMACIÓN DEL NEGOCIO (editada por el administrador)
${conocimiento}`;
  }
}
