// src/enrollments/enrollments.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Enrollments')
@ApiBearerAuth()
@Controller('enrollments')
@UseGuards(JwtAuthGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Inscribirse a un curso' })
  async create(@Request() req: any, @Body() body: { courseId: string }) {
    // El JWT trae 'sub', no 'id'. Con req.user.id llegaba undefined
    // y Postgres rechazaba el insert en la columna uuid.
    const enrollment = await this.enrollmentsService.create(
      req.user.sub,
      body.courseId,
    );

    return {
      success: true,
      message: 'Inscripción exitosa',
      data: enrollment,
    };
  }

  // Las rutas con texto fijo van ANTES que las de ':id'
  @Get('my-enrollments')
  @ApiOperation({ summary: 'Obtener mis inscripciones' })
  async getMyEnrollments(@Request() req: any) {
    const enrollments = await this.enrollmentsService.findMyEnrollments(
      req.user.sub,
    );

    return { success: true, data: enrollments };
  }

  @Get('check/:courseId')
  @ApiOperation({ summary: '¿Estoy inscrito en este curso?' })
  async check(@Request() req: any, @Param('courseId') courseId: string) {
    const resultado = await this.enrollmentsService.isEnrolled(
      req.user.sub,
      courseId,
    );

    return { success: true, data: resultado };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener inscripción por ID' })
  async findOne(@Request() req: any, @Param('id') id: string) {
    const enrollment = await this.enrollmentsService.findOne(id, req.user.sub);
    return { success: true, data: enrollment };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancelar mi inscripción' })
  async remove(@Request() req: any, @Param('id') id: string) {
    await this.enrollmentsService.remove(id, req.user.sub);
    return { success: true, message: 'Inscripción cancelada' };
  }
}
