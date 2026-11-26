// src/progress/progress.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
import { Progress } from './entities/progress.entity';
import { Lesson } from '../courses/entities/lesson.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Progress, Lesson, Enrollment]), NotificationsModule],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
