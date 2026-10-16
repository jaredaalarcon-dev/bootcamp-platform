// src/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Category } from '../courses/entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Course, Enrollment, Category])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
