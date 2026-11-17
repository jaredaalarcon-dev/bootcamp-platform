// src/legal/legal.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TermsAcceptance } from './entities/terms-acceptance.entity';
import { LegalController } from './legal.controller';
import { LegalService } from './legal.service';

@Module({
  imports: [TypeOrmModule.forFeature([TermsAcceptance])],
  controllers: [LegalController],
  providers: [LegalService],
  exports: [LegalService], // el registro guarda la aceptación inicial
})
export class LegalModule {}
