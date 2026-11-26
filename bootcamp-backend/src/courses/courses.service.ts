// src/courses/courses.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './entities/course.entity';
import { Category } from './entities/category.entity';
import { CreateCourseDto, UpdateCourseDto } from './dto/create-course.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { N8nService } from '../integrations/n8n.service';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private readonly notifications: NotificationsService,
    private readonly n8n: N8nService,
  ) {}

  // Aviso a todos los alumnos cuando un curso pasa a "publicado".
  // La clave evita repetirlo si se despublica y se vuelve a publicar.
  private async avisarSiSePublico(antes: string | undefined, curso: Course) {
    if (curso.status !== 'published' || antes === 'published') return;
    this.n8n.emitir('curso.publicado', { courseId: curso.id, curso: curso.title, descripcion: curso.description, enlace: `/courses/${curso.id}` });
    await this.notifications.notifyAllStudents({
      type: 'curso_nuevo',
      title: `Nuevo curso disponible: ${curso.title}`,
      message: (curso.description ?? '').slice(0, 200) || 'Ya puedes inscribirte y empezar a aprender.',
      link: `/courses/${curso.id}`,
      key: `curso_nuevo:${curso.id}`,
    });
  }

  async create(createCourseDto: CreateCourseDto) {
    const category = await this.categoryRepository.findOne({
      where: { id: createCourseDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    const course = this.courseRepository.create({
      ...createCourseDto,
      category,
    });

    const guardado = await this.courseRepository.save(course);
    await this.avisarSiSePublico(undefined, guardado);
    return guardado;
  }

  async findAll() {
    return this.courseRepository.find({
      relations: { category: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: {
        category: true,
        modules: {
          lessons: {
            video: true,
          },
        },
      },
      order: {
        modules: {
          orderNumber: 'ASC',
          lessons: {
            orderNumber: 'ASC',
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    return course;
  }

  async update(id: string, updateCourseDto: UpdateCourseDto) {
    const course = await this.courseRepository.findOne({ where: { id } });

    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    if (updateCourseDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateCourseDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Categoría no encontrada');
      }

      course.category = category;
    }

    const estadoAnterior = course.status;
    Object.assign(course, updateCourseDto);

    const guardado = await this.courseRepository.save(course);
    await this.avisarSiSePublico(estadoAnterior, guardado);
    return guardado;
  }

  async remove(id: string) {
    const course = await this.courseRepository.findOne({ where: { id } });

    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    await this.courseRepository.remove(course);
    return { id, eliminado: true };
  }

  async findByCategory(categoryId: string) {
    return this.courseRepository.find({
      where: { category: { id: categoryId } },
      relations: { category: true },
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: string, status: string) {
    const course = await this.courseRepository.findOne({ where: { id } });

    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    const estadoAnterior = course.status;
    course.status = status;
    const guardado = await this.courseRepository.save(course);
    await this.avisarSiSePublico(estadoAnterior, guardado);
    return guardado;
  }
}
