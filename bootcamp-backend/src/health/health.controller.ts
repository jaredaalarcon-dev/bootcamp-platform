// src/health/health.controller.ts
// GET /health → lo usan Render (para saber si el servidor está bien) y el
// "keep-alive" que lo visita cada 10 minutos para que no se apague.
// También hace una consulta mínima a la base de datos para que Supabase
// no pause el proyecto gratuito por inactividad.
import { Controller, Get, HttpCode, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@ApiTags('Health')
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

  @Get()
  @HttpCode(200)
  async check() {
    const inicio = Date.now();
    let baseDeDatos: 'ok' | 'error' = 'ok';
    try {
      await this.db.query('SELECT 1');
    } catch {
      baseDeDatos = 'error';
    }
    return {
      status: baseDeDatos === 'ok' ? 'ok' : 'degradado',
      database: baseDeDatos,
      uptime: Math.round(process.uptime()),
      ms: Date.now() - inicio,
      time: new Date().toISOString(),
    };
  }
}
