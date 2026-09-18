// src/courses/courses.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/create-course.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';

@ApiTags('Courses')
@ApiBearerAuth()
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @ApiOperation({ summary: 'Crear un nuevo curso' })
  async create(@Body() createCourseDto: CreateCourseDto) {
    const course = await this.coursesService.create(createCourseDto);
    return {
      success: true,
      message: 'Curso creado exitosamente',
      data: course,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los cursos' })
  async findAll() {
    const courses = await this.coursesService.findAll();
    return { success: true, data: courses };
  }

  // IMPORTANTE: esta ruta va ANTES que @Get(':id').
  // Nest resuelve en orden de declaración, así que estando después
  // la palabra 'category' se interpretaba como un id de curso.
  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Obtener cursos por categoría' })
  async findByCategory(@Param('categoryId') categoryId: string) {
    const courses = await this.coursesService.findByCategory(categoryId);
    return { success: true, data: courses };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un curso por ID' })
  async findOne(@Param('id') id: string) {
    const course = await this.coursesService.findOne(id);
    return { success: true, data: course };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @ApiOperation({ summary: 'Actualizar un curso' })
  async update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    const course = await this.coursesService.update(id, updateCourseDto);
    return {
      success: true,
      message: 'Curso actualizado exitosamente',
      data: course,
    };
  }

  // Sin @HttpCode(204): un 204 no puede llevar cuerpo, así que el
  // mensaje de confirmación nunca llegaba al frontend.
  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @ApiOperation({ summary: 'Eliminar un curso' })
  async remove(@Param('id') id: string) {
    await this.coursesService.remove(id);
    return { success: true, message: 'Curso eliminado exitosamente' };
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @ApiOperation({ summary: 'Cambiar estado del curso' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    const course = await this.coursesService.updateStatus(id, body.status);
    return { success: true, message: 'Estado actualizado', data: course };
  }
}
