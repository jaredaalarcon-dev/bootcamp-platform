// src/integrations/n8n.service.ts
// Conexión con n8n (automatizaciones). La plataforma avisa a n8n cuando pasa
// algo importante y n8n decide qué hacer: enviar un correo, un mensaje de
// Telegram/WhatsApp, guardar en una hoja de cálculo, etc.
//
// Variables (opcionales; sin ellas la plataforma funciona igual):
//   N8N_WEBHOOK_URL     URL del nodo Webhook de tu flujo en n8n (Production URL)
//   N8N_WEBHOOK_SECRET  Clave compartida. Se envía en la cabecera x-sijb-key y
//                       firma cada evento (x-sijb-signature = HMAC-SHA256 del cuerpo)
//   N8N_API_KEY         Clave para que n8n use /v1/integrations/n8n/* (enviar avisos)
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID } from 'crypto';

export const EVENTOS_N8N = {
  'alumno.registrado': 'Un alumno nuevo creó su cuenta',
  'curso.inscripcion': 'Un alumno se inscribió en un curso',
  'curso.completado': 'Un alumno completó el 100 % de un curso',
  'examen_final.aprobado': 'Un alumno aprobó el examen final (constancia habilitada)',
  'pregunta.nueva': 'Un alumno hizo una pregunta en una lección',
  'pregunta.respondida': 'El equipo respondió una pregunta',
  'resena.nueva': 'Un alumno calificó un curso',
  'pago.confirmado': 'Se confirmó el pago de un certificado oficial',
  'curso.publicado': 'Se publicó un curso nuevo',
  'reclamo.nuevo': 'Llegó una hoja al Libro de Reclamaciones (plazo de 15 días hábiles)',
  'prueba': 'Evento de prueba enviado desde el panel admin',
} as const;
export type EventoN8n = keyof typeof EVENTOS_N8N;

@Injectable()
export class N8nService {
  private readonly logger = new Logger(N8nService.name);
  private readonly url: string;
  private readonly secreto: string;
  private estado = { enviados: 0, fallidos: 0, ultimo: null as null | { evento: string; ok: boolean; fecha: string; detalle?: string } };

  constructor(config: ConfigService) {
    this.url = (config.get<string>('N8N_WEBHOOK_URL') ?? '').trim();
    this.secreto = (config.get<string>('N8N_WEBHOOK_SECRET') ?? '').trim();
  }

  get configurado() {
    return /^https?:\/\//i.test(this.url);
  }

  /** Envía el evento sin esperar ni romper la operación que lo originó. */
  emitir(evento: EventoN8n, datos: Record<string, unknown>) {
    if (!this.configurado) return;
    void this.enviar(evento, datos);
  }

  /** Igual que emitir, pero espera el resultado (para la prueba del panel). */
  async enviar(evento: EventoN8n, datos: Record<string, unknown>) {
    if (!this.configurado) return { ok: false, detalle: 'n8n no está configurado (falta N8N_WEBHOOK_URL)' };
    const cuerpo = JSON.stringify({
      id: randomUUID(),
      evento,
      descripcion: EVENTOS_N8N[evento],
      fecha: new Date().toISOString(),
      plataforma: 'SIJB Bootcamp',
      datos,
    });
    const cabeceras: Record<string, string> = { 'Content-Type': 'application/json', 'x-sijb-event': evento };
    if (this.secreto) {
      cabeceras['x-sijb-key'] = this.secreto;
      cabeceras['x-sijb-signature'] = createHmac('sha256', this.secreto).update(cuerpo).digest('hex');
    }
    try {
      const r = await fetch(this.url, { method: 'POST', headers: cabeceras, body: cuerpo, signal: AbortSignal.timeout(8000) });
      const ok = r.ok;
      this.registrar(evento, ok, ok ? undefined : `n8n respondió ${r.status}`);
      return { ok, detalle: ok ? 'Evento recibido por n8n' : `n8n respondió ${r.status}. Revisa que el flujo esté activo.` };
    } catch (e) {
      const detalle = (e as Error).name === 'TimeoutError' ? 'n8n no respondió a tiempo' : 'No se pudo conectar con n8n';
      this.registrar(evento, false, detalle);
      this.logger.warn(`${detalle} (${evento})`);
      return { ok: false, detalle };
    }
  }

  private registrar(evento: string, ok: boolean, detalle?: string) {
    if (ok) this.estado.enviados++; else this.estado.fallidos++;
    this.estado.ultimo = { evento, ok, fecha: new Date().toISOString(), detalle };
  }

  info() {
    let destino: string | null = null;
    try { destino = this.configurado ? new URL(this.url).host : null; } catch { destino = null; }
    return {
      configurado: this.configurado,
      firmado: !!this.secreto,
      destino,
      ...this.estado,
      eventos: Object.entries(EVENTOS_N8N).filter(([k]) => k !== 'prueba').map(([evento, descripcion]) => ({ evento, descripcion })),
    };
  }
}
