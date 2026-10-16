import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { ProgressModule } from './progress/progress.module';
import { UploadModule } from './upload/upload.module';
import { AdminModule } from './admin/admin.module';
import { CertificatesModule } from './certificates/certificates.module';
import { ResourcesModule } from './resources/resources.module';
import { BlogModule } from './blog/blog.module';
import configuration from './config/configuration';
import { Category } from './courses/entities/category.entity';
import { Course } from './courses/entities/course.entity';
import { Module as ModuleEntity } from './courses/entities/module.entity';
import { Lesson } from './courses/entities/lesson.entity';
import { Video } from './courses/entities/video.entity';
import { Enrollment } from './enrollments/entities/enrollment.entity';
import { Progress } from './progress/entities/progress.entity';
import { CourseResource } from './resources/entities/course-resource.entity';
import { BlogPost } from './blog/entities/blog-post.entity';
import { BlogSubscriber } from './blog/entities/blog-subscriber.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url:
          configService.get<string>('DATABASE_URL') || process.env.DATABASE_URL,
        entities: [
          Category,
          Course,
          ModuleEntity,
          Lesson,
          Video,
          Enrollment,
          Progress,
          CourseResource,
          BlogPost,
          BlogSubscriber,
        ],
        synchronize: process.env.NODE_ENV !== 'production',
        logging: false,
        ssl: {
          rejectUnauthorized: false,
        },
      }),
    }),
    AuthModule,
    CoursesModule,
    EnrollmentsModule,
    ProgressModule,
    UploadModule,
    AdminModule,
    CertificatesModule,
    ResourcesModule,
    BlogModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
