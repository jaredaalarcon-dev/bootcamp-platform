// src/legal/legal.controller.ts
import { Body, Controller, Get, Headers, HttpCode, Ip, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AcceptTermsDto } from './dto/accept-terms.dto';
import { LegalService } from './legal.service';
import { TERMS_VERSION } from './legal.constants';

@ApiTags('Legal')
@Controller('legal')
export class LegalController {
  constructor(private readonly legal: LegalService) {}

  @Get('version')
  @ApiOperation({ summary: 'Versión vigente de los Términos y la Política de Privacidad' })
  version() {
    return { success: true, data: { currentVersion: TERMS_VERSION } };
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '¿El usuario actual aceptó la versión vigente?' })
  async status(@Request() req) {
    return { success: true, data: await this.legal.status(req.user.sub) };
  }

  @Post('accept')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aceptar la versión vigente (usuarios que ya tenían cuenta)' })
  async accept(@Request() req, @Body() dto: AcceptTermsDto, @Ip() ip: string, @Headers('user-agent') ua?: string) {
    const data = await this.legal.accept(req.user.sub, dto.version, { source: 'inicio_sesion', ip, userAgent: ua });
    return { success: true, data };
  }
}
