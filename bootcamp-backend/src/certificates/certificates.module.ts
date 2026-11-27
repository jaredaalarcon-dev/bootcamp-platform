// src/certificates/certificates.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificatesService } from './certificates.service';
import { AdminCertificateDataController, CertificatesController, CertificateVerifyController } from './certificates.controller';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Lesson } from '../courses/entities/lesson.entity';
import { Progress } from '../progress/entities/progress.entity';
import { CertificateProfile } from './entities/certificate-profile.entity';
import { IssuedCertificate } from './entities/issued-certificate.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Enrollment, Lesson, Progress, CertificateProfile, IssuedCertificate]),
    NotificationsModule,
  ],
  controllers: [CertificatesController, CertificateVerifyController, AdminCertificateDataController],
  providers: [CertificatesService],
})
export class CertificatesModule {}
