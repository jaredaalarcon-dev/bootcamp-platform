// src/courses/modules.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Module as ModuleEntity } from './entities/module.entity';
import { Course } from './entities/course.entity';
import { CreateModuleDto, UpdateModuleDto } from './dto/create-module.dto';

@Injectable()
export class ModulesService {
  constructor(
    @InjectRepository(ModuleEntity)
    private moduleRepository: Repository<ModuleEntity>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
  ) {}

  // Los módulos de un curso, con sus lecciones y videos, ya ordenados
  async findByCourse(courseId: string) {
    return this.moduleRepository.find({
      where: { course: { id: courseId } },
      relations: { lessons: { video: true } },
      order: {
        orderNumber: 'ASC',
        lessons: { orderNumber: 'ASC' },
      },
    });
  }

  async findOne(id: string) {
    const encontrado = await this.moduleRepository.findOne({
      where: { id },
      relations: { lessons: { video: true }, course: true },
      order: { lessons: { orderNumber: 'ASC' } },
    });

    if (!encontrado) {
      throw new NotFoundException('Módulo no encontrado');
    }

    return encontrado;
  }

  async create(dto: CreateModuleDto) {
    const course = await this.courseRepository.findOne({
      where: { id: dto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    const nuevo = this.moduleRepository.create({
      title: dto.title,
      description: dto.description,
      orderNumber: dto.orderNumber ?? (await this.siguienteOrden(dto.courseId)),
      course,
    });

    return this.moduleRepository.save(nuevo);
  }

  async update(id: string, dto: UpdateModuleDto) {
    const existente = await this.moduleRepository.findOne({ where: { id } });

    if (!existente) {
      throw new NotFoundException('Módulo no encontrado');
    }

    Object.assign(existente, dto);
    return this.moduleRepository.save(existente);
  }

  // Borra el módulo con sus lecciones y videos (cascada en la FK)
  async remove(id: string) {
    const existente = await this.moduleRepository.findOne({ where: { id } });

    if (!existente) {
      throw new NotFoundException('Módulo no encontrado');
    }

    await this.moduleRepository.remove(existente);
    return { id, eliminado: true };
  }

  private async siguienteOrden(courseId: string) {
    const cuantos = await this.moduleRepository.count({
      where: { course: { id: courseId } },
    });
    return cuantos + 1;
  }
}
