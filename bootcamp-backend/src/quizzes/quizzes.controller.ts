// src/quizzes/quizzes.controller.ts
import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { QuizzesService } from './quizzes.service';
import { SaveQuizDto, SubmitQuizDto } from './dto/quiz.dto';

@ApiTags('Cuestionarios (alumno)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzes: QuizzesService) {}

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Cuestionarios del curso con mi mejor nota' })
  async byCourse(@Request() req: any, @Param('courseId', ParseUUIDPipe) courseId: string) {
    return { success: true, data: await this.quizzes.listForCourse(req.user.sub, courseId) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Preguntas del cuestionario (sin respuestas)' })
  async one(@Request() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return { success: true, data: await this.quizzes.getForStudent(req.user.sub, id) };
  }

  @Post(':id/attempts')
  @ApiOperation({ summary: 'Enviar mis respuestas y obtener la nota' })
  async submit(@Request() req: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: SubmitQuizDto) {
    return { success: true, data: await this.quizzes.submit(req.user.sub, id, dto.answers) };
  }
}

@ApiTags('Cuestionarios (admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminAuthGuard)
@Controller('admin/quizzes')
export class AdminQuizzesController {
  constructor(private readonly quizzes: QuizzesService) {}

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Cuestionarios del curso con respuestas y estadísticas' })
  async byCourse(@Param('courseId', ParseUUIDPipe) courseId: string) {
    return { success: true, data: await this.quizzes.adminList(courseId) };
  }

  @Post()
  @ApiOperation({ summary: 'Crear cuestionario' })
  async create(@Body() dto: SaveQuizDto) {
    return { success: true, data: await this.quizzes.save(dto) };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Editar cuestionario (reemplaza sus preguntas)' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SaveQuizDto) {
    return { success: true, data: await this.quizzes.save(dto, id) };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar cuestionario' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return { success: true, data: await this.quizzes.remove(id) };
  }
}
