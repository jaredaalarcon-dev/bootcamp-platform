// src/assistant/assistant.service.ts
// El "cerebro" de JB Assist. Cada mensaje pasa por estas capas, en orden:
//   1. Botones / temas fijos (engine/intenciones.ts) ......... al instante, sin IA
//   2. Preguntas frecuentes creadas por el admin ............... al instante, sin IA
//   3. Información de un curso concreto (base de datos) ........ al instante, sin IA
//   4. Respuestas de IA ya dadas antes (caché) ................. al instante
//   5. IA (Gemini → modelos de respaldo → Groq) ................ solo si hace falta
//   6. Si la IA no está o falla: menú de temas + WhatsApp ....... nunca deja sin respuesta
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
import { AssistantFaq } from './entities/assistant-faq.entity';
import { ErrorIA, preguntarGemini, preguntarGroq, RespuestaIA, Turno } from './ai-providers';
import { Accion, CONTACTO, Contexto, CursoInfo, INTENCIONES, MENU } from './engine/intenciones';
import { buscarIntencion, detectar, FaqMotor, resolverAcciones, resolverRespuesta, respuestaCurso } from './engine/motor';
import { normalizar, palabras } from './engine/texto';

export const ASSISTANT_NAME = 'JB Assist';

// Cuántos mensajes anteriores recuerda en cada respuesta
const MEMORIA = 12;
// Límites para cuidar la cuota gratuita de la IA y evitar abusos
const IA_POR_MINUTO_CONVERSACION = 8;
const POR_MINUTO_CONVERSACION = 25;
const POR_MINUTO_IP = 40;
// Caché de respuestas de la IA para preguntas repetidas
const CACHE_HORAS = 12;
const CACHE_MAX = 300;
const NUMERO_ANTERIOR = '+51 926 392 858';

export interface RespuestaChat {
  reply: string;
  provider: string;
  intent: string | null;
  actions: Accion[];
  conversationId: string;
}

const CONOCIMIENTO_INICIAL = `EMPRESA
Soluciones Integrales JB — "Tu mejor opción tecnológica". Empresa peruana de tecnología.

PLATAFORMA BOOTCAMP
- Cursos virtuales de tecnología que el alumno avanza a su propio ritmo.
- Cada curso tiene módulos y lecciones en video; el avance se guarda automáticamente.
- Al completar el 100% de un curso, el alumno descarga gratis su CONSTANCIA de culminación en "Certificados".
- El CERTIFICADO OFICIAL (con foto, documento y código de verificación) tiene costo: se solicita y se paga por WhatsApp; cuando el equipo confirma el pago, se habilita en "Certificados". Antes, el alumno registra su nombre, documento y foto formal en "Mi perfil".
- Cualquiera puede verificar un certificado o constancia en la página "Verificar certificado" con su código.
- Los alumnos inscritos encuentran guías en PDF, kits de práctica (ZIP), ejercicios y bibliografía en la pestaña "Recursos" de cada curso.

CÓMO EMPEZAR
1. Crear una cuenta gratis en la página "Registrarse".
2. Entrar a "Explorar cursos", elegir un curso y pulsar "Inscribirme".
3. El curso aparece en "Mis cursos" para continuar cuando quieras.

CONTACTO
- Correo: consultas@solucionesintegralesjb.com
- WhatsApp: +51 943 014 618 (pagos, certificados y consultas directas)
- Facebook, Instagram, TikTok y YouTube: Soluciones Integrales JB

PRECIOS Y HORARIOS DE ATENCIÓN
(Completar desde el panel admin. Mientras no estén aquí, JB Assist deriva esas preguntas al equipo.)`;

@Injectable()
export class AssistantService implements OnModuleInit {
  private readonly log = new Logger('JB Assist');
  private catalogo: { cursos: CursoInfo[]; hasta: number } | null = null;
  private faqsCache: { lista: AssistantFaq[]; hasta: number } | null = null;
  private cacheIA = new Map<string, { texto: string; proveedor: string; hasta: number }>();
  private golpes = new Map<string, number[]>();

  constructor(
    @InjectRepository(AssistantMessage) private mensajes: Repository<AssistantMessage>,
    @InjectRepository(AssistantSetting) private ajustes: Repository<AssistantSetting>,
    @InjectRepository(AssistantFaq) private faqs: Repository<AssistantFaq>,
    @InjectDataSource() private db: DataSource,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    // Crea la configuración inicial la primera vez
    try {
      const existe = await this.ajustes.findOne({ where: { id: 'main' } });
      if (!existe) {
        await this.ajustes.save({ id: 'main', enabled: true, aiEnabled: true, knowledge: CONOCIMIENTO_INICIAL });
      } else if (existe.knowledge.includes(NUMERO_ANTERIOR) || existe.knowledge.includes('obtiene su certificado en la sección')) {
        // Actualiza el texto antiguo: nuevo WhatsApp y el modelo constancia gratis / certificado pagado
        let k = existe.knowledge.split(NUMERO_ANTERIOR).join(CONTACTO.whatsapp);
        k = k.replace(
          '- Al completar el 100% de un curso, el alumno obtiene su certificado en la sección "Certificados".',
          CONOCIMIENTO_INICIAL.split('\n').filter((l) => l.includes('CONSTANCIA') || l.includes('CERTIFICADO OFICIAL') || l.includes('Verificar certificado')).join('\n'),
        );
        k = k.replace('Soluciones Integrales JB S.A.C.', 'Soluciones Integrales JB');
        await this.ajustes.save({ ...existe, knowledge: k });
      }
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
        aiEnabled: true,
        knowledge: CONOCIMIENTO_INICIAL,
        updatedAt: new Date(),
      }
    );
  }

  async updateSettings(datos: { enabled?: boolean; knowledge?: string; aiEnabled?: boolean }) {
    const actual = await this.getSettings();
    this.cacheIA.clear(); // el conocimiento cambió: las respuestas guardadas pueden quedar viejas
    return this.ajustes.save({ ...actual, ...datos, id: 'main' });
  }

  private get iaConfigurada() {
    return !!(this.gemini.key || this.groq.key);
  }

  async status() {
    const s = await this.getSettings();
    // El chatbot funciona aunque no haya IA configurada (responde con sus temas fijos)
    return {
      name: ASSISTANT_NAME,
      enabled: s.enabled,
      configured: this.iaConfigurada,
      ai: s.aiEnabled && this.iaConfigurada,
    };
  }

  /** Temas de la "Ayuda rápida" (botones) */
  async menu() {
    const faqs = (await this.faqsActivas()).slice(0, 6);
    const titulo = (id: string) => INTENCIONES.find((i) => i.id === id)?.titulo ?? id;
    const grupos = MENU.map((g) => ({
      id: g.id,
      titulo: g.titulo,
      icono: g.icono,
      items: g.intents.map((id) => ({ intent: id, titulo: titulo(id) })),
    }));
    if (faqs.length) {
      grupos.push({
        id: 'faq',
        titulo: 'Preguntas frecuentes',
        icono: 'faq',
        items: faqs.map((f) => ({ intent: `faq:${f.id}`, titulo: f.question })),
      });
    }
    return { groups: grupos, whatsapp: CONTACTO.whatsapp };
  }

  // ── Conversación ─────────────────────────────────────────────────────────
  async chat(opts: {
    conversationId: string;
    channel: CanalAsistente;
    message?: string;
    intent?: string;
    userName?: string;
    ip?: string;
  }): Promise<RespuestaChat> {
    const texto = (opts.message ?? '').trim().slice(0, 1000);
    const ajustes = await this.getSettings();
    if (!ajustes.enabled) throw new ServiceUnavailableException(`${ASSISTANT_NAME} está desactivado por el momento.`);
    this.limitar(`c:${opts.conversationId}`, POR_MINUTO_CONVERSACION);
    if (opts.ip) this.limitar(`ip:${opts.ip}`, POR_MINUTO_IP);

    const nombre = opts.userName?.trim().slice(0, 60) || undefined;
    const ctx: Contexto = { nombre, cursos: await this.cursosInfo() };
    const faqs = await this.faqsActivas();

    // Capas 1 a 3: botones, temas fijos, preguntas frecuentes y cursos (sin IA)
    let r: Omit<RespuestaChat, 'conversationId'> | null = opts.intent
      ? await this.porBoton(opts.intent, ctx, faqs)
      : await this.porTexto(texto, ctx, faqs);

    // Capas 4 a 6: caché, IA y respaldo
    if (!r) r = await this.conIA(texto, opts, ajustes);

    const pregunta = texto || r.intent || '';
    await this.mensajes.save([
      this.mensajes.create({ conversationId: opts.conversationId, channel: opts.channel, role: 'user', content: pregunta, provider: null, intent: r.intent }),
      this.mensajes.create({ conversationId: opts.conversationId, channel: opts.channel, role: 'assistant', content: r.reply, provider: r.provider, intent: r.intent }),
    ]);
    return { ...r, conversationId: opts.conversationId };
  }

  /** La persona tocó un botón: respuesta exacta de ese tema */
  private async porBoton(intent: string, ctx: Contexto, faqs: AssistantFaq[]): Promise<Omit<RespuestaChat, 'conversationId'>> {
    if (intent.startsWith('curso:')) {
      const curso = ctx.cursos.find((c) => c.id === intent.slice(6));
      if (curso) {
        const rc = respuestaCurso(curso);
        return { reply: rc.texto, provider: 'curso', intent: 'curso', actions: rc.acciones };
      }
    }
    if (intent.startsWith('faq:')) {
      const faq = faqs.find((f) => f.id === intent.slice(4));
      if (faq) return this.respuestaFaq(faq);
    }
    const i = buscarIntencion(intent);
    if (i) return { reply: resolverRespuesta(i, ctx), provider: 'bot', intent: i.id, actions: resolverAcciones(i, ctx) };
    return this.respuestaMenu('No encontré ese tema. Elige uno de estos 👇');
  }

  /** La persona escribió: el motor intenta entenderla sin IA */
  private async porTexto(texto: string, ctx: Contexto, faqs: AssistantFaq[]): Promise<Omit<RespuestaChat, 'conversationId'> | null> {
    const d = detectar(texto, faqs.map(this.aMotor), ctx.cursos);
    switch (d.tipo) {
      case 'intencion':
        return { reply: resolverRespuesta(d.intencion, ctx), provider: 'bot', intent: d.intencion.id, actions: resolverAcciones(d.intencion, ctx) };
      case 'faq': {
        const faq = faqs.find((f) => f.id === d.faq.id);
        return faq ? this.respuestaFaq(faq) : null;
      }
      case 'curso': {
        const rc = respuestaCurso(d.curso);
        return { reply: rc.texto, provider: 'curso', intent: 'curso', actions: rc.acciones };
      }
      case 'dudoso': {
        // Pregunta corta y ambigua: mejor confirmar el tema que gastar IA
        if (palabras(texto).length <= 4 || !(await this.iaDisponible())) {
          return {
            reply: '¿Te refieres a alguno de estos temas? 🤔',
            provider: 'bot',
            intent: 'dudoso',
            actions: [
              ...d.opciones.map((o): Accion => ({ tipo: 'respuesta', etiqueta: o.titulo, intent: o.id })),
              { tipo: 'respuesta', etiqueta: 'Otro tema', intent: 'menu' } as Accion,
            ],
          };
        }
        return null;
      }
      default:
        return null;
    }
  }

  private async iaDisponible() {
    const a = await this.getSettings();
    return a.aiEnabled && this.iaConfigurada;
  }

  private async conIA(
    texto: string,
    opts: { conversationId: string; channel: CanalAsistente; userName?: string },
    ajustes: AssistantSetting,
  ): Promise<Omit<RespuestaChat, 'conversationId'>> {
    if (!texto) return this.respuestaMenu('Elige un tema 👇');
    if (!ajustes.aiEnabled || !this.iaConfigurada) {
      return this.respuestaMenu(
        'Esa pregunta no la tengo en mis temas 🤔. Puedo ayudarte con estos, o te atiende una persona por WhatsApp:',
        'sin_respuesta',
      );
    }

    // Memoria: últimos mensajes de esta conversación
    const previos = await this.mensajes.find({
      where: { conversationId: opts.conversationId },
      order: { createdAt: 'DESC' },
      take: MEMORIA,
    });
    const turnos: Turno[] = previos.reverse().map((m) => ({ role: m.role, content: m.content }));
    while (turnos.length && turnos[0].role !== 'user') turnos.shift();
    turnos.push({ role: 'user', content: texto });

    // Capa 4: la misma pregunta (sin conversación previa) ya se respondió hace poco
    const clave = normalizar(texto);
    const usarCache = turnos.length === 1 && clave.length >= 8;
    const guardada = usarCache ? this.cacheIA.get(clave) : undefined;
    if (guardada && guardada.hasta > Date.now()) {
      return { reply: guardada.texto, provider: 'cache', intent: 'ia', actions: this.accionesDeIA(guardada.texto) };
    }

    try {
      this.limitar(`ia:${opts.conversationId}`, IA_POR_MINUTO_CONVERSACION);
      const system = await this.systemPrompt(ajustes.knowledge, opts.channel, opts.userName);
      const respuesta = await this.preguntar(system, turnos);
      if (usarCache) this.guardarEnCache(clave, respuesta);
      return { reply: respuesta.text, provider: respuesta.provider, intent: 'ia', actions: this.accionesDeIA(respuesta.text) };
    } catch (e) {
      if (e instanceof HttpException && e.getStatus() === HttpStatus.TOO_MANY_REQUESTS) throw e;
      // Capa 6: la IA no respondió → el chatbot igual ayuda
      return this.respuestaMenu(
        'Ahora mismo no puedo analizar esa pregunta en detalle 🙏. Mira si tu duda está en estos temas o escríbenos por WhatsApp:',
        'sin_respuesta',
      );
    }
  }

  private respuestaFaq(faq: AssistantFaq): Omit<RespuestaChat, 'conversationId'> {
    this.faqs.increment({ id: faq.id }, 'hits', 1).catch(() => undefined);
    return {
      reply: faq.answer,
      provider: 'faq',
      intent: `faq:${faq.id}`,
      actions: /whatsapp/i.test(faq.answer)
        ? [{ tipo: 'whatsapp', etiqueta: 'Abrir WhatsApp', texto: 'Hola, vengo de la plataforma Bootcamp. Tengo una consulta.' } as Accion]
        : [],
    };
  }

  private respuestaMenu(texto: string, intent = 'menu'): Omit<RespuestaChat, 'conversationId'> {
    const menu = buscarIntencion('menu');
    return {
      reply: texto,
      provider: intent === 'menu' ? 'bot' : 'fallback',
      intent,
      actions: [
        ...(menu ? resolverAcciones(menu, { cursos: [] }).slice(0, 5) : []),
        { tipo: 'whatsapp', etiqueta: 'Hablar con un asesor', texto: 'Hola, vengo de la plataforma Bootcamp y tengo una consulta.' } as Accion,
      ],
    };
  }

  private accionesDeIA(texto: string): Accion[] {
    return /whatsapp|asesor|pago/i.test(texto)
      ? [{ tipo: 'whatsapp', etiqueta: 'Abrir WhatsApp', texto: 'Hola, vengo de la plataforma Bootcamp. Tengo una consulta.' }]
      : [];
  }

  private guardarEnCache(clave: string, r: RespuestaIA) {
    if (this.cacheIA.size >= CACHE_MAX) {
      const primera = this.cacheIA.keys().next().value;
      if (primera) this.cacheIA.delete(primera);
    }
    this.cacheIA.set(clave, { texto: r.text, proveedor: r.provider, hasta: Date.now() + CACHE_HORAS * 3_600_000 });
  }

  private aMotor = (f: AssistantFaq): FaqMotor => ({
    id: f.id,
    pregunta: f.question,
    variantes: f.variants.split('\n').map((v) => v.trim()).filter(Boolean),
    respuesta: f.answer,
  });

  private async faqsActivas() {
    if (this.faqsCache && this.faqsCache.hasta > Date.now()) return this.faqsCache.lista;
    let lista: AssistantFaq[] = [];
    try {
      lista = await this.faqs.find({ where: { active: true }, order: { hits: 'DESC', createdAt: 'ASC' } });
    } catch (e) {
      this.log.warn(`No se pudieron leer las preguntas frecuentes: ${(e as Error).message}`);
    }
    this.faqsCache = { lista, hasta: Date.now() + 60_000 };
    return lista;
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

  // ── Admin: estadísticas ──────────────────────────────────────────────────
  async stats(diasPedidos: number) {
    const dias = [7, 30, 90].includes(diasPedidos) ? diasPedidos : 30;
    const desde = new Date(Date.now() - dias * 86_400_000);
    const [porProveedor, porTema, sinRespuesta, conversaciones] = await Promise.all([
      this.db.query(
        `SELECT COALESCE(provider, 'otro') AS provider, COUNT(*)::int AS total
           FROM assistant_messages WHERE role = 'assistant' AND "createdAt" >= $1
          GROUP BY 1 ORDER BY 2 DESC`,
        [desde],
      ),
      this.db.query(
        `SELECT intent, COUNT(*)::int AS total
           FROM assistant_messages
          WHERE role = 'assistant' AND "createdAt" >= $1 AND intent IS NOT NULL
            AND intent NOT IN ('ia', 'sin_respuesta', 'dudoso')
          GROUP BY intent ORDER BY 2 DESC LIMIT 10`,
        [desde],
      ),
      // Lo que el chatbot no supo responder solo: ideas para nuevas preguntas frecuentes
      this.db.query(
        `SELECT content, COUNT(*)::int AS veces, MAX("createdAt") AS ultima,
                MAX(intent) AS intent
           FROM assistant_messages
          WHERE role = 'user' AND "createdAt" >= $1 AND intent IN ('ia', 'sin_respuesta', 'dudoso')
          GROUP BY content ORDER BY MAX("createdAt") DESC LIMIT 25`,
        [desde],
      ),
      this.db.query(
        `SELECT COUNT(DISTINCT "conversationId")::int AS total FROM assistant_messages WHERE "createdAt" >= $1`,
        [desde],
      ),
    ]);

    const total = porProveedor.reduce((a: number, r: { total: number }) => a + r.total, 0);
    const sinIA = porProveedor
      .filter((r: { provider: string }) => ['bot', 'faq', 'curso', 'cache'].includes(r.provider))
      .reduce((a: number, r: { total: number }) => a + r.total, 0);
    const faqs = await this.faqs.find();
    const titulo = (intent: string) => {
      if (intent === 'curso') return 'Información de un curso';
      if (intent.startsWith('faq:')) return `FAQ: ${faqs.find((f) => `faq:${f.id}` === intent)?.question ?? 'eliminada'}`;
      return INTENCIONES.find((i) => i.id === intent)?.titulo ?? intent;
    };
    return {
      days: dias,
      conversations: conversaciones[0]?.total ?? 0,
      answers: total,
      withoutAI: sinIA,
      withoutAIRate: total ? Math.round((sinIA / total) * 100) : 0,
      byProvider: porProveedor,
      topIntents: porTema.map((r: { intent: string; total: number }) => ({ intent: r.intent, title: titulo(r.intent), total: r.total })),
      unanswered: sinRespuesta,
      ai: (await this.getSettings()).aiEnabled && this.iaConfigurada,
    };
  }

  // ── Admin: preguntas frecuentes ──────────────────────────────────────────
  listFaqs() {
    return this.faqs.find({ order: { createdAt: 'DESC' } });
  }

  async createFaq(dto: { question: string; variants?: string; answer: string; active?: boolean }) {
    const faq = await this.faqs.save(
      this.faqs.create({ question: dto.question.trim(), variants: (dto.variants ?? '').trim(), answer: dto.answer.trim(), active: dto.active ?? true }),
    );
    this.faqsCache = null;
    return faq;
  }

  async updateFaq(id: string, dto: { question: string; variants?: string; answer: string; active?: boolean }) {
    const faq = await this.faqs.findOne({ where: { id } });
    if (!faq) throw new NotFoundException('Pregunta no encontrada');
    faq.question = dto.question.trim();
    faq.variants = (dto.variants ?? '').trim();
    faq.answer = dto.answer.trim();
    if (typeof dto.active === 'boolean') faq.active = dto.active;
    this.faqsCache = null;
    return this.faqs.save(faq);
  }

  async deleteFaq(id: string) {
    const r = await this.faqs.delete({ id });
    if (!r.affected) throw new NotFoundException('Pregunta no encontrada');
    this.faqsCache = null;
    return { id, deleted: true };
  }

  /** Admin: ver cómo entendería el chatbot un mensaje (no se guarda, no usa IA) */
  async test(message: string) {
    const ctx: Contexto = { cursos: await this.cursosInfo() };
    const faqs = await this.faqsActivas();
    const r = await this.porTexto(message, ctx, faqs);
    return r
      ? { understood: true, ...r }
      : { understood: false, reply: null, provider: (await this.iaDisponible()) ? 'ia' : 'fallback', intent: null, actions: [] };
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
      `${ASSISTANT_NAME} no pudo responder ahora. Intenta en un momento o escríbenos por WhatsApp al ${CONTACTO.whatsapp}.`,
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
  private async cursosInfo(): Promise<CursoInfo[]> {
    if (this.catalogo && this.catalogo.hasta > Date.now()) return this.catalogo.cursos;
    let cursos: CursoInfo[] = this.catalogo?.cursos ?? [];
    try {
      const filas: any[] = await this.db.query(
        `SELECT c.id, c.title, c.description, cat.name AS category,
                COUNT(DISTINCT m.id)::int AS modules, COUNT(l.id)::int AS lessons
           FROM courses c
           LEFT JOIN categories cat ON cat.id = c."categoryId"
           LEFT JOIN modules m ON m."courseId" = c.id
           LEFT JOIN lessons l ON l."moduleId" = m.id
          WHERE c.status = 'published'
          GROUP BY c.id, cat.name
          ORDER BY c.title`,
      );
      cursos = filas.map((c) => ({
        id: c.id,
        titulo: c.title,
        descripcion: String(c.description ?? ''),
        categoria: c.category ?? '',
        modulos: c.modules,
        lecciones: c.lessons,
      }));
    } catch (e) {
      this.log.warn(`No se pudo leer el catálogo: ${(e as Error).message}`);
    }
    this.catalogo = { cursos, hasta: Date.now() + 5 * 60_000 };
    return cursos;
  }

  private async cursos(): Promise<string> {
    const lista = await this.cursosInfo();
    if (!lista.length) return 'Por ahora no hay cursos publicados.';
    return lista
      .map((c) => {
        const desc = c.descripcion.replace(/\s+/g, ' ').slice(0, 280);
        return `- ${c.titulo} (${c.categoria || 'General'}; ${c.modulos} módulos, ${c.lecciones} lecciones): ${desc}`;
      })
      .join('\n');
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
- Usa SOLO la información de abajo para datos del negocio (cursos, precios, horarios, contacto). Si algo no está, dilo con honestidad y ofrece el WhatsApp ${CONTACTO.whatsapp} o el correo ${CONTACTO.correo}. Nunca inventes precios, fechas, descuentos ni cursos.
- Si preguntan algo fuera de tema (política, temas personales, tareas que no son de tecnología), responde con amabilidad que solo puedes ayudar con la plataforma y con tecnología.
- No pidas datos sensibles (DNI, tarjetas, contraseñas). Si alguien comparte una contraseña, recomiéndale cambiarla.
- No digas que eres un modelo de Google, Meta u otra empresa; eres ${ASSISTANT_NAME}.
- Si la persona quiere hablar con un humano, dale el WhatsApp ${CONTACTO.whatsapp}.
- Pagos: se coordinan SOLO por WhatsApp. La constancia es gratis; el certificado oficial tiene costo. Nunca des precios ni datos bancarios.

CURSOS PUBLICADOS (datos reales de la plataforma)
${await this.cursos()}

INFORMACIÓN DEL NEGOCIO (editada por el administrador)
${conocimiento}`;
  }
}
