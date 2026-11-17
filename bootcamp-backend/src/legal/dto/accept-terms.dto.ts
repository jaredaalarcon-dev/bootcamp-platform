// src/legal/dto/accept-terms.dto.ts
import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcceptTermsDto {
  @ApiProperty({ example: '2026-11-17', description: 'Versión de los términos que el usuario leyó' })
  @IsString()
  @MaxLength(20)
  version: string;
}
