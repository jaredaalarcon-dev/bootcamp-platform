// src/community/community.controller.ts — preguntas por lección y reseñas
import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { QuestionsService } from './questions.service';
import { ReviewsService } from './reviews.service';
import { AnswerQuestionDto, AskQuestionDto, ReviewDto, ReviewVisibilityDto } from './dto/community.dto';

@ApiTags('Comunidad (alumno)')
@Controller('community')
export class CommunityController {
  constructor(
    private readonly questions: QuestionsService,
    private readonly reviews: ReviewsService,
  ) {}

  @Get('reviews/summary')
  @ApiOperation({ summary: 'Promedio de estrellas de cada curso (público)' })
  async summary() {
    return { success: true, data: await this.reviews.summaries() };
  }

  @Get('lessons/:lessonId/questions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Preguntas de una lección' })
  async lessonQuestions(@Request() req: any, @Param('lessonId', ParseUUIDPipe) lessonId: string) {
    return { success: true, data: await this.questions.listForLesson(req.user.sub, lessonId) };
  }

  @Post('lessons/:lessonId/questions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Hacer una pregunta en una lección' })
  async ask(@Request() req: any, @Param('lessonId', ParseUUIDPipe) lessonId: string, @Body() dto: AskQuestionDto) {
    return { success: true, data: await this.questions.ask(req.user.sub, lessonId, dto.question) };
  }

  @Delete('questions/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Borrar mi pregunta (si aún no fue respondida)' })
  async removeQuestion(@Request() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return { success: true, data: await this.questions.removeOwn(req.user.sub, id) };
  }

  @Get('courses/:courseId/reviews')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reseñas de un curso, con la mía' })
  async courseReviews(@Request() req: any, @Param('courseId', ParseUUIDPipe) courseId: string) {
    return { success: true, data: await this.reviews.forCourse(courseId, req.user.sub) };
  }

  @Put('courses/:courseId/review')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Crear o editar mi reseña' })
  async review(@Request() req: any, @Param('courseId', ParseUUIDPipe) courseId: string, @Body() dto: ReviewDto) {
    return { success: true, data: await this.reviews.upsert(req.user.sub, courseId, dto.rating, dto.comment) };
  }

  @Delete('courses/:courseId/review')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Borrar mi reseña' })
  async removeReview(@Request() req: any, @Param('courseId', ParseUUIDPipe) courseId: string) {
    return { success: true, data: await this.reviews.removeOwn(req.user.sub, courseId) };
  }
}

@ApiTags('Comunidad (admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminAuthGuard)
@Controller('admin/community')
export class AdminCommunityController {
  constructor(
    private readonly questions: QuestionsService,
    private readonly reviews: ReviewsService,
  ) {}

  @Get('questions')
  @ApiOperation({ summary: 'Preguntas de los alumnos (pendientes, respondidas o todas)' })
  async listQuestions(@Query('estado') estado?: string, @Query('courseId') courseId?: string) {
    return { success: true, data: await this.questions.adminList(estado, courseId || undefined) };
  }

  @Get('questions/pending-count')
  @ApiOperation({ summary: 'Cantidad de preguntas sin responder' })
  async pending() {
    return { success: true, data: await this.questions.pendingCount() };
  }

  @Patch('questions/:id/answer')
  @ApiOperation({ summary: 'Responder una pregunta (avisa al alumno)' })
  async answer(@Request() req: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: AnswerQuestionDto) {
    return { success: true, data: await this.questions.answer(id, dto.answer, req.user) };
  }

  @Delete('questions/:id')
  @ApiOperation({ summary: 'Eliminar una pregunta' })
  async removeQuestion(@Param('id', ParseUUIDPipe) id: string) {
    return { success: true, data: await this.questions.adminRemove(id) };
  }

  @Get('reviews')
  @ApiOperation({ summary: 'Todas las reseñas' })
  async listReviews(@Query('courseId') courseId?: string) {
    return { success: true, data: await this.reviews.adminList(courseId || undefined) };
  }

  @Patch('reviews/:id/visibility')
  @ApiOperation({ summary: 'Ocultar o mostrar una reseña' })
  async visibility(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReviewVisibilityDto) {
    return { success: true, data: await this.reviews.setHidden(id, dto.hidden) };
  }

  @Delete('reviews/:id')
  @ApiOperation({ summary: 'Eliminar una reseña' })
  async removeReview(@Param('id', ParseUUIDPipe) id: string) {
    return { success: true, data: await this.reviews.adminRemove(id) };
  }
}
