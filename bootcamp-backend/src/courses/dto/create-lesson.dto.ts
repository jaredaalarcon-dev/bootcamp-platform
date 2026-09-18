// src/courses/dto/create-lesson.dto.ts
import { IsString, IsOptional, IsNotEmpty, IsInt, Min } from 'class-validator';

export class CreateLessonDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  moduleId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  orderNumber?: number;

  // El video viaja dentro de la lección: es 1 a 1
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  videoTitle?: string;

  // Duración en segundos
  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;
}

export class UpdateLessonDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  orderNumber?: number;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  videoTitle?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;
}
