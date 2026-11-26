// src/notifications/notifications.controller.ts
import { Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('Notificaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Mis notificaciones (más recientes primero)' })
  async list(@Request() req: any, @Query('limit') limit?: string) {
    return { success: true, data: await this.notifications.list(req.user.sub, Number(limit) || 30) };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Cantidad de notificaciones sin leer' })
  async unread(@Request() req: any) {
    return { success: true, data: await this.notifications.unreadCount(req.user.sub) };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Marcar todas como leídas' })
  async readAll(@Request() req: any) {
    return { success: true, data: await this.notifications.markAllRead(req.user.sub) };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar una notificación como leída' })
  async read(@Request() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return { success: true, data: await this.notifications.markRead(req.user.sub, id) };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una notificación' })
  async remove(@Request() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return { success: true, data: await this.notifications.remove(req.user.sub, id) };
  }
}
