// src/progress/progress.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Progress')
@ApiBearerAuth()
@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Resumen de progreso para el dashboard' })
  async resumen(@Request() req: any) {
    return this.progressService.resumen(req.user.sub);
  }

  @Get('my-courses')
  @ApiOperation({ summary: 'Mis cursos con su porcentaje de avance' })
  async misCursos(@Request() req: any) {
    return this.progressService.misCursos(req.user.sub);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Mi progreso dentro de un curso' })
  async porCurso(@Request() req: any, @Param('courseId') courseId: string) {
    return this.progressService.porCurso(req.user.sub, courseId);
  }

  @Post('lesson/:lessonId')
  @ApiOperation({ summary: 'Marcar o desmarcar una lección como vista' })
  async marcar(
    @Request() req: any,
    @Param('lessonId') lessonId: string,
    @Body() body: { completed?: boolean },
  ) {
    return this.progressService.marcarLeccion(
      req.user.sub,
      lessonId,
      body?.completed !== false,
    );
  }
}
