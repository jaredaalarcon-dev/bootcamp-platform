// src/courses/courses.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { ModulesService } from './modules.service';
import { ModulesController } from './modules.controller';
import { LessonsService } from './lessons.service';
import { LessonsController } from './lessons.controller';
import { Course } from './entities/course.entity';
import { Category } from './entities/category.entity';
import { Module as ModuleEntity } from './entities/module.entity';
import { Lesson } from './entities/lesson.entity';
import { Video } from './entities/video.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Course, Category, ModuleEntity, Lesson, Video]),
  ],
  controllers: [
    CoursesController,
    CategoriesController,
    ModulesController,
    LessonsController,
  ],
  providers: [
    CoursesService,
    CategoriesService,
    ModulesService,
    LessonsService,
  ],
  exports: [CoursesService, CategoriesService, ModulesService, LessonsService],
})
export class CoursesModule {}
