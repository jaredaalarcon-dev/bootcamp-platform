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
  ParseUUIDPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AnalyticsService } from './analytics.service';
import { PaymentsService } from './payments.service';
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
    private readonly paymentsService: PaymentsService,
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

  @Get('payments')
  @ApiOperation({ summary: 'Inscripciones con su estado de pago y de certificado' })
  async getPayments() {
    const data = await this.paymentsService.list();
    return { success: true, data };
  }

  @Patch('enrollments/:id/payment')
  @ApiOperation({ summary: 'Marcar o desmarcar el pago del certificado de una inscripción' })
  async setPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { paid: boolean; note?: string | null },
  ) {
    if (typeof body?.paid !== 'boolean') {
      throw new BadRequestException('Indica "paid": true o false');
    }
    if (body.note != null && typeof body.note !== 'string') {
      throw new BadRequestException('La nota debe ser texto');
    }
    const data = await this.paymentsService.setPayment(id, body.paid, body.note);
    return { success: true, data };
  }
}
