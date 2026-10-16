// src/certificates/certificates.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificatesService } from './certificates.service';
import { CertificatesController } from './certificates.controller';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Lesson } from '../courses/entities/lesson.entity';
import { Progress } from '../progress/entities/progress.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Enrollment, Lesson, Progress])],
  controllers: [CertificatesController],
  providers: [CertificatesService],
})
export class CertificatesModule {}
