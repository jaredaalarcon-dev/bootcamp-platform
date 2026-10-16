// src/resources/resources.controller.ts
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import * as path from 'path';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import {
  EXTENSIONES_PERMITIDAS,
  MAX_RESOURCE_MB,
  ResourcesService,
} from './resources.service';
import {
  CreateLinkResourceDto,
  UpdateResourceDto,
  UploadResourceDto,
} from './dto/resource.dto';
import type { ArchivoSubido } from '../upload/upload.service';

@ApiTags('Resources')
@ApiBearerAuth()
@Controller('resources')
@UseGuards(JwtAuthGuard)
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Listar recursos de un curso (alumno inscrito o admin)' })
  async findByCourse(
    @Request() req: any,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    const data = await this.resourcesService.findByCourse(courseId, req.user);
    return { success: true, data };
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Obtener enlace temporal de descarga (60 s)' })
  async download(@Request() req: any, @Param('id', ParseUUIDPipe) id: string) {
    const data = await this.resourcesService.getDownloadUrl(id, req.user);
    return { success: true, data };
  }

  @Post('link')
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: 'Agregar un recurso de tipo enlace' })
  async createLink(@Body() dto: CreateLinkResourceDto) {
    const data = await this.resourcesService.createLink(dto);
    return { success: true, data };
  }

  @Post('upload')
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: 'Subir un archivo (PDF, Word, Excel, PPT, ZIP…)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_RESOURCE_MB * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (!EXTENSIONES_PERMITIDAS.includes(ext)) {
          return cb(
            new BadRequestException(`Formato no permitido. Usa: ${EXTENSIONES_PERMITIDAS.join(', ')}`),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async upload(@Body() dto: UploadResourceDto, @UploadedFile() file: ArchivoSubido) {
    const data = await this.resourcesService.upload(dto, file);
    return { success: true, data };
  }

  @Patch(':id')
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: 'Editar un recurso' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateResourceDto) {
    const data = await this.resourcesService.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: 'Eliminar un recurso (y su archivo)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.resourcesService.remove(id);
  }
}
