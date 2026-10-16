// src/resources/dto/resource.dto.ts
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TIPOS_RECURSO } from '../entities/course-resource.entity';
import type { TipoRecurso } from '../entities/course-resource.entity';

/** Crear un recurso de tipo enlace (JSON) */
export class CreateLinkResourceDto {
  @IsUUID()
  courseId: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(TIPOS_RECURSO as unknown as string[])
  type?: TipoRecurso;

  @IsUrl({ require_protocol: true }, { message: 'Ingresa un enlace válido (https://...)' })
  externalUrl: string;
}

/** Campos que acompañan al archivo en la subida (multipart/form-data) */
export class UploadResourceDto {
  @IsUUID()
  courseId: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(TIPOS_RECURSO as unknown as string[])
  type?: TipoRecurso;
}

export class UpdateResourceDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(TIPOS_RECURSO as unknown as string[])
  type?: TipoRecurso;

  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: 'Ingresa un enlace válido (https://...)' })
  externalUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  orderNumber?: number;
}
