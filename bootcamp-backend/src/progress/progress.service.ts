// src/progress/progress.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Progress } from './entities/progress.entity';
import { Lesson } from '../courses/entities/lesson.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(Progress)
    private progressRepository: Repository<Progress>,
    @InjectRepository(Lesson)
    private lessonRepository: Repository<Lesson>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
  ) {}

  // Marca o desmarca una lección como vista
  async marcarLeccion(userId: string, lessonId: string, completada: boolean) {
    const leccion = await this.lessonRepository.findOne({
      where: { id: lessonId },
      relations: { module: { course: true } },
    });

    if (!leccion) {
      throw new NotFoundException('Lección no encontrada');
    }

    let registro = await this.progressRepository.findOne({
      where: { userId, lessonId },
    });

    if (!registro) {
      registro = this.progressRepository.create({ userId, lessonId });
    }

    registro.status = completada ? 'completed' : 'pending';
    registro.completedAt = completada ? new Date() : null;

    await this.progressRepository.save(registro);

    const courseId = leccion.module?.course?.id;
    const resumenCurso = courseId
      ? await this.porCurso(userId, courseId)
      : null;

    // El curso se marca como terminado solo cuando ya no queda nada
    if (courseId && resumenCurso) {
      await this.actualizarEstadoInscripcion(
        userId,
        courseId,
        resumenCurso.percentage,
      );
    }

    return {
      lessonId,
      completed: completada,
      course: resumenCurso,
    };
  }

  // Progreso del usuario dentro de un curso
  async porCurso(userId: string, courseId: string) {
    const totalLessons = await this.lessonRepository.count({
      where: { module: { course: { id: courseId } } },
    });

    const completadas = await this.progressRepository.find({
      where: {
        userId,
        status: 'completed',
        lesson: { module: { course: { id: courseId } } },
      },
    });

    const completedLessons = completadas.length;
    const percentage =
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

    return {
      courseId,
      totalLessons,
      completedLessons,
      percentage,
      completedLessonIds: completadas.map((p) => p.lessonId),
    };
  }

  // Mis cursos con su porcentaje real, para la página "Mis Cursos"
  async misCursos(userId: string) {
    const inscripciones = await this.enrollmentRepository.find({
      where: { userId },
      relations: { course: { category: true } },
      order: { enrolledAt: 'DESC' },
    });

    return Promise.all(
      inscripciones.map(async (inscripcion) => {
        const progreso = await this.porCurso(userId, inscripcion.courseId);

        return {
          enrollmentId: inscripcion.id,
          status: inscripcion.status,
          enrolledAt: inscripcion.enrolledAt,
          course: inscripcion.course,
          progress: {
            totalLessons: progreso.totalLessons,
            completedLessons: progreso.completedLessons,
            percentage: progreso.percentage,
          },
        };
      }),
    );
  }

  // Números del dashboard
  async resumen(userId: string) {
    const cursos = await this.misCursos(userId);

    const totalLessons = cursos.reduce(
      (acc, c) => acc + c.progress.totalLessons,
      0,
    );
    const completedLessons = cursos.reduce(
      (acc, c) => acc + c.progress.completedLessons,
      0,
    );
    const completedCourses = cursos.filter(
      (c) => c.progress.totalLessons > 0 && c.progress.percentage === 100,
    ).length;

    return {
      enrolledCourses: cursos.length,
      activeCourses: cursos.length - completedCourses,
      completedCourses,
      completedLessons,
      totalLessons,
      overallPercentage:
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0,
    };
  }

  private async actualizarEstadoInscripcion(
    userId: string,
    courseId: string,
    percentage: number,
  ) {
    const inscripcion = await this.enrollmentRepository.findOne({
      where: { userId, courseId },
    });

    if (!inscripcion) return;

    const nuevoEstado = percentage === 100 ? 'completed' : 'in_progress';

    if (inscripcion.status !== nuevoEstado) {
      inscripcion.status = nuevoEstado;
      await this.enrollmentRepository.save(inscripcion);
    }
  }
}
