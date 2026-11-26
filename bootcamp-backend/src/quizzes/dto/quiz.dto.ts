// src/quizzes/dto/quiz.dto.ts
import { Type } from 'class-transformer';

// Mismo criterio que ParseUUIDPipe: cualquier UUID con formato válido
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsInt, IsObject, IsOptional, IsString,
  Matches, Max, MaxLength, Min, MinLength, ValidateNested,
} from 'class-validator';

export class QuizQuestionDto {
  @IsString()
  @MinLength(3, { message: 'Cada pregunta necesita un enunciado' })
  @MaxLength(1000)
  text: string;

  @IsArray()
  @ArrayMinSize(2, { message: 'Cada pregunta necesita al menos 2 opciones' })
  @ArrayMaxSize(6, { message: 'Cada pregunta puede tener hasta 6 opciones' })
  @IsString({ each: true })
  @MinLength(1, { each: true, message: 'Hay una opción vacía' })
  @MaxLength(300, { each: true })
  options: string[];

  @IsInt()
  @Min(0)
  @Max(5)
  correctIndex: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  explanation?: string;
}

export class SaveQuizDto {
  @Matches(UUID, { message: 'Curso no válido' })
  courseId: string;

  @IsOptional()
  @Matches(UUID, { message: 'Módulo no válido' })
  moduleId?: string | null;

  @IsOptional()
  @Matches(UUID, { message: 'Lección no válida' })
  lessonId?: string | null;

  // Examen final del curso: sin módulo ni lección. Se desbloquea al 100 %
  // y aprobarlo es requisito para la constancia y el certificado.
  @IsOptional()
  @IsBoolean()
  final?: boolean;

  @IsString()
  @MinLength(3, { message: 'El cuestionario necesita un título' })
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsInt()
  @Min(0)
  @Max(100)
  passingScore: number;

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsArray()
  @ArrayMinSize(1, { message: 'Agrega al menos una pregunta' })
  @ArrayMaxSize(50, { message: 'Un cuestionario puede tener hasta 50 preguntas' })
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionDto)
  questions: QuizQuestionDto[];
}

export class SubmitQuizDto {
  @IsObject()
  answers: Record<string, number>;
}
