// src/courses/lessons.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson } from './entities/lesson.entity';
import { Video } from './entities/video.entity';
import { Module as ModuleEntity } from './entities/module.entity';
import { CreateLessonDto, UpdateLessonDto } from './dto/create-lesson.dto';
import { aUrlIncrustable } from './utils/video-url';

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(Lesson)
    private lessonRepository: Repository<Lesson>,
    @InjectRepository(Video)
    private videoRepository: Repository<Video>,
    @InjectRepository(ModuleEntity)
    private moduleRepository: Repository<ModuleEntity>,
  ) {}

  async findOne(id: string) {
    const encontrada = await this.lessonRepository.findOne({
      where: { id },
      relations: { video: true, module: true },
    });

    if (!encontrada) {
      throw new NotFoundException('Lección no encontrada');
    }

    return encontrada;
  }

  async create(dto: CreateLessonDto) {
    const moduloPadre = await this.moduleRepository.findOne({
      where: { id: dto.moduleId },
    });

    if (!moduloPadre) {
      throw new NotFoundException('Módulo no encontrado');
    }

    const nueva = await this.lessonRepository.save(
      this.lessonRepository.create({
        title: dto.title,
        description: dto.description,
        orderNumber:
          dto.orderNumber ?? (await this.siguienteOrden(dto.moduleId)),
        module: moduloPadre,
      }),
    );

    if (dto.videoUrl) {
      await this.videoRepository.save(
        this.videoRepository.create({
          title: dto.videoTitle || dto.title,
          videoUrl: aUrlIncrustable(dto.videoUrl),
          duration: dto.duration,
          lesson: nueva,
        }),
      );
    }

    return this.findOne(nueva.id);
  }

  async update(id: string, dto: UpdateLessonDto) {
    const existente = await this.findOne(id);

    if (dto.title !== undefined) existente.title = dto.title;
    if (dto.description !== undefined) existente.description = dto.description;
    if (dto.orderNumber !== undefined) existente.orderNumber = dto.orderNumber;

    await this.lessonRepository.save(existente);

    // Cadena vacía = quitar el video de la lección
    if (dto.videoUrl === '') {
      if (existente.video) {
        await this.videoRepository.remove(existente.video);
      }
    } else if (dto.videoUrl || dto.videoTitle || dto.duration !== undefined) {
      const videoActual = await this.videoRepository.findOne({
        where: { lesson: { id } },
      });

      if (videoActual) {
        if (dto.videoUrl) videoActual.videoUrl = aUrlIncrustable(dto.videoUrl);
        if (dto.videoTitle) videoActual.title = dto.videoTitle;
        if (dto.duration !== undefined) videoActual.duration = dto.duration;
        await this.videoRepository.save(videoActual);
      } else if (dto.videoUrl) {
        await this.videoRepository.save(
          this.videoRepository.create({
            title: dto.videoTitle || existente.title,
            videoUrl: aUrlIncrustable(dto.videoUrl),
            duration: dto.duration,
            lesson: existente,
          }),
        );
      }
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    const existente = await this.findOne(id);

    if (existente.video) {
      await this.videoRepository.remove(existente.video);
    }

    await this.lessonRepository.remove(existente);
    return { id, eliminada: true };
  }

  private async siguienteOrden(moduleId: string) {
    const cuantas = await this.lessonRepository.count({
      where: { module: { id: moduleId } },
    });
    return cuantas + 1;
  }
}
