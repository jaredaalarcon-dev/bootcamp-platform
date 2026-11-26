// src/certificates/certificates.controller.ts
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CertificatesService, FOTO_MAX_MB, FOTO_TIPOS } from './certificates.service';
import type { ArchivoFoto } from './certificates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { SaveCertificateProfileDto } from './dto/certificate-profile.dto';

@ApiTags('Certificates')
@ApiBearerAuth()
@Controller('certificates')
@UseGuards(JwtAuthGuard)
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Mis datos para el certificado (nombre, documento y foto)' })
  async getProfile(@Request() req: any) {
    return { success: true, data: await this.certificatesService.getProfile(req.user.sub) };
  }

  @Put('profile')
  @ApiOperation({ summary: 'Guardar mis datos para el certificado' })
  async saveProfile(@Request() req: any, @Body() dto: SaveCertificateProfileDto) {
    return { success: true, data: await this.certificatesService.saveProfile(req.user.sub, dto) };
  }

  @Post('profile/photo')
  @ApiOperation({ summary: 'Subir mi foto formal (JPG, PNG o WEBP, máx. 3 MB)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: FOTO_MAX_MB * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!FOTO_TIPOS.includes(file.mimetype)) {
          return cb(new BadRequestException('La foto debe ser JPG, PNG o WEBP'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadPhoto(@Request() req: any, @UploadedFile() file: ArchivoFoto) {
    return { success: true, data: await this.certificatesService.uploadPhoto(req.user.sub, file) };
  }

  @Delete('profile/photo')
  @ApiOperation({ summary: 'Quitar mi foto formal' })
  async deletePhoto(@Request() req: any) {
    return { success: true, data: await this.certificatesService.deletePhoto(req.user.sub) };
  }

  @Get('my')
  @ApiOperation({ summary: 'Estado de pago y documentos emitidos de mis cursos' })
  async mySummary(@Request() req: any) {
    return { success: true, data: await this.certificatesService.mySummary(req.user.sub) };
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Certificado (pagado) o constancia (gratis) de un curso completado' })
  async getCertificate(
    @Request() req: any,
    @Param('courseId') courseId: string,
    @Query('tipo') tipo?: string,
  ) {
    const data = await this.certificatesService.getCertificate(req.user.sub, courseId, tipo);
    return { success: true, data };
  }
}

// Verificación pública: cualquiera puede comprobar un documento con su código
@ApiTags('Certificates')
@Controller('certificates/verify')
export class CertificateVerifyController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get(':code')
  @ApiOperation({ summary: 'Verificar un certificado o constancia por su código (público)' })
  async verify(@Param('code') code: string) {
    return { success: true, data: await this.certificatesService.verify(code) };
  }
}

@ApiTags('Certificates (admin)')
@ApiBearerAuth()
@Controller('admin/certificate-data')
@UseGuards(JwtAuthGuard, AdminAuthGuard)
export class AdminCertificateDataController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get()
  @ApiOperation({ summary: 'Datos que cada alumno registró para su constancia y certificado' })
  async list() {
    return { success: true, data: await this.certificatesService.adminDatos() };
  }
}
