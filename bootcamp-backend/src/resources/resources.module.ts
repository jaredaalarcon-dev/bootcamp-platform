// src/resources/resources.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';
import { CourseResource } from './entities/course-resource.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Course } from '../courses/entities/course.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CourseResource, Enrollment, Course])],
  controllers: [ResourcesController],
  providers: [ResourcesService],
})
export class ResourcesModule {}
