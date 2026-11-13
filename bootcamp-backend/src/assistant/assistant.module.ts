// src/assistant/assistant.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { AssistantMessage } from './entities/assistant-message.entity';
import { AssistantSetting } from './entities/assistant-setting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AssistantMessage, AssistantSetting])],
  controllers: [AssistantController],
  providers: [AssistantService],
  exports: [AssistantService], // WhatsApp lo reutilizará
})
export class AssistantModule {}
