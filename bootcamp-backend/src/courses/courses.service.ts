// src/courses/courses.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './entities/course.entity';
import { Category } from './entities/category.entity';
import { CreateCourseDto, UpdateCourseDto } from './dto/create-course.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

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

    return this.courseRepository.save(course);
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

    Object.assign(course, updateCourseDto);

    return this.courseRepository.save(course);
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

    course.status = status;
    return this.courseRepository.save(course);
  }
}
