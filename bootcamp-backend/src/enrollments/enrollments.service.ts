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
import { N8nService } from '../integrations/n8n.service';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
    private readonly n8n: N8nService,
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

    const guardada = await this.enrollmentRepository.save(inscripcion);
    void this.avisarN8n(userId, courseId);
    return guardada;
  }

  private async avisarN8n(userId: string, courseId: string) {
    if (!this.n8n.configurado) return;
    const [d] = await this.enrollmentRepository.manager.query(
      `SELECT p.email, p.first_name AS nombre, c.title AS curso FROM profiles p, courses c WHERE p.supabase_id = $1 AND c.id = $2`,
      [userId, courseId],
    ).catch(() => []);
    this.n8n.emitir('curso.inscripcion', { userId, courseId, email: d?.email, nombre: d?.nombre, curso: d?.curso });
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
