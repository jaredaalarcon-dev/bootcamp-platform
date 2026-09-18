// src/enrollments/enrollments.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from './entities/enrollment.entity';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
  ) {}

  async create(userId: string, courseId: string) {
    const existente = await this.enrollmentRepository.findOne({
      where: { userId, courseId },
    });

    if (existente) {
      throw new ConflictException('Ya estás inscrito en este curso');
    }

    const inscripcion = this.enrollmentRepository.create({
      userId,
      courseId,
      status: 'in_progress',
    });

    return this.enrollmentRepository.save(inscripcion);
  }

  async findMyEnrollments(userId: string) {
    return this.enrollmentRepository.find({
      where: { userId },
      relations: {
        course: {
          category: true,
        },
      },
      order: { enrolledAt: 'DESC' },
    });
  }

  // Para que la ficha del curso sepa si ya estás inscrito
  async isEnrolled(userId: string, courseId: string) {
    const encontrada = await this.enrollmentRepository.findOne({
      where: { userId, courseId },
    });

    return {
      enrolled: Boolean(encontrada),
      enrollment: encontrada ?? null,
    };
  }

  async findOne(id: string, userId: string) {
    const inscripcion = await this.enrollmentRepository.findOne({
      where: { id },
      relations: { course: true },
    });

    if (!inscripcion) {
      throw new NotFoundException('Inscripción no encontrada');
    }

    if (inscripcion.userId !== userId) {
      throw new ForbiddenException('Esta inscripción no es tuya');
    }

    return inscripcion;
  }

  async remove(id: string, userId: string) {
    // findOne ya comprueba que la inscripción sea de quien la pide
    const inscripcion = await this.findOne(id, userId);
    await this.enrollmentRepository.remove(inscripcion);
    return { id, cancelada: true };
  }
}
