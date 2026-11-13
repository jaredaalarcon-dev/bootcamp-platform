// src/admin/admin.controller.ts
import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminAuthGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas generales del panel admin' })
  async getStats() {
    const data = await this.adminService.getStats();
    return { success: true, data };
  }

  @Get('users')
  @ApiOperation({ summary: 'Listar todos los usuarios' })
  async getUsers() {
    const data = await this.adminService.getUsers();
    return { success: true, data };
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Cambiar el rol de un usuario' })
  async updateUserRole(
    @Param('id') id: string,
    @Body() body: { role: string },
  ) {
    if (!['admin', 'student'].includes(body.role)) {
      throw new BadRequestException('El rol debe ser "admin" o "student"');
    }
    const data = await this.adminService.updateUserRole(id, body.role);
    return { success: true, data };
  }

  @Get('reports')
  @ApiOperation({ summary: 'Inscripciones y progreso por curso' })
  async getReports() {
    const data = await this.adminService.getReports();
    return { success: true, data };
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Métricas avanzadas (días: 7, 30, 90 o 365)' })
  async getAnalytics(@Query('days') days?: string) {
    const data = await this.analyticsService.getAnalytics(Number(days) || 30);
    return { success: true, data };
  }
}
