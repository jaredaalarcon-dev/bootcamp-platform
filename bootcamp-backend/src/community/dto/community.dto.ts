// src/community/dto/community.dto.ts
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class AskQuestionDto {
  @IsString()
  @MinLength(5, { message: 'Escribe tu pregunta con un poco más de detalle (mínimo 5 caracteres)' })
  @MaxLength(1500, { message: 'La pregunta puede tener hasta 1500 caracteres' })
  question: string;
}

export class AnswerQuestionDto {
  @IsString()
  @MinLength(2, { message: 'La respuesta está vacía' })
  @MaxLength(4000, { message: 'La respuesta puede tener hasta 4000 caracteres' })
  answer: string;
}

export class ReviewDto {
  @IsInt({ message: 'La calificación debe ser un número entero' })
  @Min(1, { message: 'La calificación mínima es 1 estrella' })
  @Max(5, { message: 'La calificación máxima es 5 estrellas' })
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'La reseña puede tener hasta 1000 caracteres' })
  comment?: string;
}

export class ReviewVisibilityDto {
  @IsBoolean()
  hidden: boolean;
}
