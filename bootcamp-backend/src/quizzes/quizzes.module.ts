// src/quizzes/quizzes.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quiz } from './entities/quiz.entity';
import { QuizQuestion } from './entities/quiz-question.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';
import { QuizzesService } from './quizzes.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminQuizzesController, QuizzesController } from './quizzes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Quiz, QuizQuestion, QuizAttempt]), NotificationsModule],
  controllers: [QuizzesController, AdminQuizzesController],
  providers: [QuizzesService],
})
export class QuizzesModule {}
