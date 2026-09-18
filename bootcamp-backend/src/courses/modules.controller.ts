// src/courses/modules.controller.ts
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
import { ModulesService } from './modules.service';
import { CreateModuleDto, UpdateModuleDto } from './dto/create-module.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';

@ApiTags('Modules')
@ApiBearerAuth()
@Controller('modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  // OJO: las rutas con texto fijo van ANTES que las de ':id',
  // porque Nest resuelve en el orden en que están declaradas.
  @Get('course/:courseId')
  @ApiOperation({ summary: 'Módulos de un curso, con lecciones y videos' })
  findByCourse(@Param('courseId') courseId: string) {
    return this.modulesService.findByCourse(courseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un módulo' })
  findOne(@Param('id') id: string) {
    return this.modulesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @ApiOperation({ summary: 'Crear un módulo' })
  create(@Body() createModuleDto: CreateModuleDto) {
    return this.modulesService.create(createModuleDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @ApiOperation({ summary: 'Actualizar un módulo' })
  update(@Param('id') id: string, @Body() updateModuleDto: UpdateModuleDto) {
    return this.modulesService.update(id, updateModuleDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @ApiOperation({ summary: 'Eliminar un módulo y su contenido' })
  remove(@Param('id') id: string) {
    return this.modulesService.remove(id);
  }
}
