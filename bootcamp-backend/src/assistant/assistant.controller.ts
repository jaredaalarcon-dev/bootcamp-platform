// src/assistant/assistant.controller.ts
import { Body, Controller, Delete, Get, HttpCode, Ip, Param, ParseUUIDPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { AssistantService } from './assistant.service';
import { ChatDto, FaqDto, TestMessageDto, UpdateAssistantSettingsDto } from './dto/assistant.dto';

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
      intent: dto.intent,
      userName: dto.userName,
      ip,
    });
    return { success: true, data };
  }

  @Get('menu')
  @ApiOperation({ summary: 'Temas de la "Ayuda rápida" (botones)' })
  async menu() {
    return { success: true, data: await this.assistant.menu() };
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

  @Get('stats')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @ApiOperation({ summary: 'Métricas del chatbot (días: 7, 30 o 90)' })
  async stats(@Query('days') days?: string) {
    return { success: true, data: await this.assistant.stats(Number(days) || 30) };
  }

  @Get('faqs')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  async listFaqs() {
    return { success: true, data: await this.assistant.listFaqs() };
  }

  @Post('faqs')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  async createFaq(@Body() dto: FaqDto) {
    return { success: true, data: await this.assistant.createFaq(dto) };
  }

  @Put('faqs/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  async updateFaq(@Param('id', ParseUUIDPipe) id: string, @Body() dto: FaqDto) {
    return { success: true, data: await this.assistant.updateFaq(id, dto) };
  }

  @Delete('faqs/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  async deleteFaq(@Param('id', ParseUUIDPipe) id: string) {
    return { success: true, data: await this.assistant.deleteFaq(id) };
  }

  @Post('test')
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @ApiOperation({ summary: 'Probar cómo entiende el chatbot un mensaje (sin IA, no se guarda)' })
  async test(@Body() dto: TestMessageDto) {
    return { success: true, data: await this.assistant.test(dto.message) };
  }
}
