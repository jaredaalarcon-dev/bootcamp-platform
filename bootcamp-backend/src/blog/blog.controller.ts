// src/blog/blog.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { BlogService } from './blog.service';
import { CreateBlogPostDto, SubscribeDto, UpdateBlogPostDto } from './dto/blog.dto';

@ApiTags('Blog')
@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  // ── Público ────────────────────────────────────────────────────────────
  @Get('feed')
  @ApiOperation({ summary: 'Publicaciones visibles del blog' })
  async feed() {
    const data = await this.blogService.feed();
    return { success: true, data };
  }

  @Post('subscribe')
  @HttpCode(200)
  @ApiOperation({ summary: 'Suscribirse a las novedades del blog' })
  subscribe(@Body() dto: SubscribeDto) {
    return this.blogService.subscribe(dto.email);
  }

  // ── Admin ──────────────────────────────────────────────────────────────
  @Get('posts')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  async findAll() {
    return { success: true, data: await this.blogService.findAll() };
  }

  @Post('posts')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  async create(@Body() dto: CreateBlogPostDto) {
    return { success: true, data: await this.blogService.create(dto) };
  }

  @Patch('posts/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBlogPostDto) {
    return { success: true, data: await this.blogService.update(id, dto) };
  }

  @Delete('posts/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.blogService.remove(id);
  }

  @Get('youtube')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @ApiOperation({ summary: 'Últimos videos del canal para agregarlos al blog' })
  async youtube() {
    return { success: true, data: await this.blogService.youtubeVideos() };
  }

  @Get('subscribers')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  async subscribers() {
    return { success: true, data: await this.blogService.subscribers() };
  }
}
