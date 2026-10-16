// src/blog/dto/blog.dto.ts
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { REDES_BLOG } from '../entities/blog-post.entity';
import type { RedBlog } from '../entities/blog-post.entity';

const URL_OPTS = { require_protocol: true };
const URL_MSG = { message: 'Ingresa un enlace válido (https://...)' };

export class CreateBlogPostDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  summary?: string;

  @IsIn(REDES_BLOG as unknown as string[])
  network: RedBlog;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @IsOptional()
  @IsUrl(URL_OPTS, URL_MSG)
  imageUrl?: string;

  @IsUrl(URL_OPTS, URL_MSG)
  url: string;

  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateBlogPostDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  summary?: string;

  @IsOptional()
  @IsIn(REDES_BLOG as unknown as string[])
  network?: RedBlog;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsUrl(URL_OPTS, URL_MSG)
  url?: string;

  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class SubscribeDto {
  @IsEmail({}, { message: 'Ingresa un correo válido' })
  @MaxLength(255)
  email: string;
}
