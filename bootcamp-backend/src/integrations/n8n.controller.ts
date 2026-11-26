// src/integrations/n8n.controller.ts
import {
  BadRequestException, Body, Controller, Get, Headers, HttpCode, Post, Query, UnauthorizedException, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { timingSafeEqual } from 'crypto';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { N8nService } from './n8n.service';
import { NotificationsService } from '../notifications/notifications.service';

class AvisoN8nDto {
  @IsIn(['usuario', 'todos'])
  para: 'usuario' | 'todos';

  // Correo o id (Supabase) del alumno cuando para = usuario
  @IsOptional() @IsString() @MaxLength(200)
  usuario?: string;

  @IsString() @MinLength(3) @MaxLength(160)
  titulo: string;

  @IsString() @MinLength(3) @MaxLength(1000)
  mensaje: string;

  @IsOptional() @IsString() @MaxLength(300)
  enlace?: string;

  // Evita avisos repetidos (por ejemplo "recordatorio:2026-11-26")
  @IsOptional() @IsString() @MaxLength(120)
  clave?: string;
}

@ApiTags('Integraciones (n8n)')
@Controller()
export class N8nController {
  constructor(
    private readonly n8n: N8nService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
    @InjectDataSource() private readonly db: DataSource,
  ) {}

  // ── Panel admin ─────────────────────────────────────────────────────────
  @Get('admin/integrations/n8n')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @ApiOperation({ summary: 'Estado de la conexión con n8n' })
  estado() {
    return { success: true, data: { ...this.n8n.info(), apiHabilitada: !!this.clave() } };
  }

  @Post('admin/integrations/n8n/test')
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @ApiOperation({ summary: 'Enviar un evento de prueba a n8n' })
  async prueba() {
    return { success: true, data: await this.n8n.enviar('prueba', { mensaje: 'Hola desde SIJB Bootcamp 👋. Si ves esto en n8n, la conexión funciona.' }) };
  }

  // ── API para n8n (cabecera x-sijb-key = N8N_API_KEY) ───────────────────
  private clave() {
    return (this.config.get<string>('N8N_API_KEY') ?? '').trim();
  }

  private autorizar(recibida?: string) {
    const clave = this.clave();
    if (!clave) throw new UnauthorizedException('La API para n8n está desactivada (falta N8N_API_KEY)');
    const a = Buffer.from(recibida ?? '');
    const b = Buffer.from(clave);
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new UnauthorizedException('Clave inválida');
  }

  @Post('integrations/n8n/notify')
  @HttpCode(200)
  @ApiOperation({ summary: 'n8n envía una notificación a un alumno o a todos (cabecera x-sijb-key)' })
  async notificar(@Headers('x-sijb-key') key: string, @Body() dto: AvisoN8nDto) {
    this.autorizar(key);
    if (dto.enlace && !dto.enlace.startsWith('/')) throw new BadRequestException('El enlace debe ser una ruta de la plataforma, por ejemplo /courses');
    const aviso = { type: 'general' as const, title: dto.titulo, message: dto.mensaje, link: dto.enlace ?? null, key: dto.clave ?? null };
    if (dto.para === 'todos') {
      return { success: true, data: { enviados: await this.notifications.notifyAllStudents(aviso) } };
    }
    const u = (dto.usuario ?? '').trim();
    if (!u) throw new BadRequestException('Indica el correo o el id del alumno en "usuario"');
    const [p] = await this.db.query(
      `SELECT supabase_id AS id FROM profiles WHERE lower(email) = lower($1) OR supabase_id::text = $1 LIMIT 1`, [u],
    );
    if (!p) throw new BadRequestException('No existe un alumno con ese correo o id');
    await this.notifications.notify(p.id, aviso);
    return { success: true, data: { enviados: 1 } };
  }

  @Get('integrations/n8n/inactive-students')
  @ApiOperation({ summary: 'Alumnos con cursos sin terminar y sin avance en N días (cabecera x-sijb-key)' })
  async inactivos(@Headers('x-sijb-key') key: string, @Query('dias') diasTexto?: string) {
    this.autorizar(key);
    const dias = Math.min(Math.max(Number(diasTexto) || 7, 1), 90);
    const filas = await this.db.query(
      `SELECT p.supabase_id AS "userId", p.email, p.first_name AS nombre,
              c.id AS "courseId", c.title AS curso,
              GREATEST(e."enrolledAt"::timestamptz, COALESCE(u.ultimo, e."enrolledAt"::timestamptz)) AS "ultimoAvance"
         FROM enrollments e
         JOIN profiles p ON p.supabase_id = e."userId"
         JOIN courses c ON c.id = e."courseId"
         LEFT JOIN LATERAL (
           SELECT MAX(pr."updatedAt") AS ultimo
             FROM progress pr
             JOIN lessons l ON l.id = pr."lessonId"
             JOIN modules m ON m.id = l."moduleId"
            WHERE m."courseId" = c.id AND pr."userId" = e."userId"
         ) u ON true
        WHERE e.status <> 'completed'
          AND GREATEST(e."enrolledAt"::timestamptz, COALESCE(u.ultimo, e."enrolledAt"::timestamptz)) < now() - make_interval(days => $1)
        ORDER BY 6 ASC
        LIMIT 500`,
      [dias],
    );
    return { success: true, data: { dias, total: filas.length, alumnos: filas } };
  }
}
