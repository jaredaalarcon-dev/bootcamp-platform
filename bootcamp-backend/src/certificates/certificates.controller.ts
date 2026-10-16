// src/certificates/certificates.controller.ts
import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Certificates')
@ApiBearerAuth()
@Controller('certificates')
@UseGuards(JwtAuthGuard)
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Obtener certificado de un curso completado' })
  async getCertificate(
    @Request() req: any,
    @Param('courseId') courseId: string,
  ) {
    const data = await this.certificatesService.getCertificate(req.user.sub, courseId);
    return { success: true, data };
  }
}
