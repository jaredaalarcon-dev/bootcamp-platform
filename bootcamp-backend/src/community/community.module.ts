// src/community/community.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LessonQuestion } from './entities/lesson-question.entity';
import { CourseReview } from './entities/course-review.entity';
import { QuestionsService } from './questions.service';
import { ReviewsService } from './reviews.service';
import { AdminCommunityController, CommunityController } from './community.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([LessonQuestion, CourseReview]), NotificationsModule],
  controllers: [CommunityController, AdminCommunityController],
  providers: [QuestionsService, ReviewsService],
})
export class CommunityModule {}
