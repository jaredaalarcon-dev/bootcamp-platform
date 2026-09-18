// src/courses/dto/create-module.dto.ts
import { IsString, IsOptional, IsNotEmpty, IsInt, Min } from 'class-validator';

export class CreateModuleDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  courseId: string;

  // Si no lo mandas, el backend lo coloca al final
  @IsOptional()
  @IsInt()
  @Min(1)
  orderNumber?: number;
}

export class UpdateModuleDto {
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
}
