// src/complaints/complaints.controller.ts
import { Body, Controller, Get, Headers, Ip, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto, RespondComplaintDto } from './dto/complaint.dto';

@ApiTags('Libro de Reclamaciones')
@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaints: ComplaintsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar una hoja de reclamación (público)' })
  async create(@Body() dto: CreateComplaintDto, @Ip() ip: string, @Headers('user-agent') userAgent?: string) {
    return { success: true, data: await this.complaints.create(dto, { ip, userAgent }) };
  }

  @Get('consulta')
  @ApiOperation({ summary: 'Consultar el estado de una hoja con su código y documento (público)' })
  async consultar(@Query('codigo') codigo: string, @Query('documento') documento: string) {
    return { success: true, data: await this.complaints.consultar(codigo, documento) };
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @ApiOperation({ summary: 'Listar hojas de reclamación (admin)' })
  async list() {
    return { success: true, data: await this.complaints.list() };
  }

  @Patch(':id/respond')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @ApiOperation({ summary: 'Registrar la respuesta del proveedor (admin)' })
  async respond(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RespondComplaintDto) {
    return { success: true, data: await this.complaints.respond(id, dto.response) };
  }
}
