// src/assistant/assistant.controller.ts
import { Body, Controller, Get, HttpCode, Ip, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { AssistantService } from './assistant.service';
import { ChatDto, UpdateAssistantSettingsDto } from './dto/assistant.dto';

@ApiTags('Assistant')
@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  // ── Público (chat de la plataforma) ─────────────────────────────────────
  @Get('status')
  @ApiOperation({ summary: 'Si JB Assist está activo y configurado' })
  async status() {
    return { success: true, data: await this.assistant.status() };
  }

  @Post('chat')
  @HttpCode(200)
  @ApiOperation({ summary: 'Enviar un mensaje a JB Assist' })
  async chat(@Body() dto: ChatDto, @Ip() ip: string) {
    const data = await this.assistant.chat({
      conversationId: dto.conversationId,
      channel: 'web',
      message: dto.message,
      userName: dto.userName,
      ip,
    });
    return { success: true, data };
  }

  @Get('history/:conversationId')
  @ApiOperation({ summary: 'Mensajes recientes de una conversación web' })
  async history(@Param('conversationId') id: string) {
    if (!/^[a-zA-Z0-9-]{8,64}$/.test(id)) return { success: true, data: [] };
    return { success: true, data: await this.assistant.history(id) };
  }

  // ── Admin ────────────────────────────────────────────────────────────────
  @Get('settings')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  async getSettings() {
    return { success: true, data: await this.assistant.getSettings() };
  }

  @Put('settings')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  async updateSettings(@Body() dto: UpdateAssistantSettingsDto) {
    return { success: true, data: await this.assistant.updateSettings(dto) };
  }

  @Get('conversations')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  async conversations() {
    return { success: true, data: await this.assistant.conversations() };
  }

  @Get('conversations/:conversationId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  async conversation(@Param('conversationId') id: string) {
    return { success: true, data: await this.assistant.conversation(id) };
  }
}
