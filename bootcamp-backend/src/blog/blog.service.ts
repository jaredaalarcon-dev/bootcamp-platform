// src/blog/blog.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { BlogPost } from './entities/blog-post.entity';
import { BlogSubscriber } from './entities/blog-subscriber.entity';
import { CreateBlogPostDto, UpdateBlogPostDto } from './dto/blog.dto';
import { obtenerVideosYoutube } from './youtube-feed';

// Canal oficial de Soluciones Integrales JB (se puede cambiar en el .env)
const CANAL_YOUTUBE = 'UCwZllsxQMp2LwUSIDmldUeQ';

export interface ItemFeed {
  id: string;
  title: string;
  summary: string | null;
  network: string;
  category: string | null;
  imageUrl: string | null;
  url: string;
  publishedAt: string;
  auto: boolean;
}

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(BlogPost)
    private postRepo: Repository<BlogPost>,
    @InjectRepository(BlogSubscriber)
    private subRepo: Repository<BlogSubscriber>,
    private config: ConfigService,
  ) {}

  /** Lo que ve el público: solo las publicaciones que el admin agregó y dejó visibles */
  async feed() {
    const posts = await this.postRepo.find({
      where: { isPublished: true },
      order: { publishedAt: 'DESC' },
      take: 60,
    });
    const items: ItemFeed[] = posts.map((p) => ({
      id: p.id,
      title: p.title,
      summary: p.summary,
      network: p.network,
      category: p.category,
      imageUrl: p.imageUrl,
      url: p.url,
      publishedAt: new Date(p.publishedAt).toISOString(),
      auto: false,
    }));
    return { items };
  }

  /**
   * Últimos videos del canal de YouTube para que el admin elija cuáles
   * publicar en el blog (ya no se publican solos). `added` indica si ese
   * video ya está en el blog.
   */
  async youtubeVideos() {
    const canal = this.config.get<string>('YOUTUBE_CHANNEL_ID') || CANAL_YOUTUBE;
    const videos = await obtenerVideosYoutube(canal);
    const urls = (await this.postRepo.find({ select: { url: true } })).map((p) => p.url);
    return videos.map((v) => ({
      videoId: v.videoId,
      title: v.title,
      summary: v.description ? v.description.slice(0, 300) : '',
      imageUrl: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${v.videoId}`,
      publishedAt: v.publishedAt,
      added: urls.some((u) => u.includes(v.videoId)),
    }));
  }

  // ── Admin ──────────────────────────────────────────────────────────────
  findAll() {
    return this.postRepo.find({ order: { publishedAt: 'DESC' } });
  }

  create(dto: CreateBlogPostDto) {
    const post = this.postRepo.create({
      title: dto.title.trim(),
      summary: dto.summary?.trim() || null,
      network: dto.network,
      category: dto.category?.trim() || null,
      imageUrl: dto.imageUrl?.trim() || null,
      url: dto.url.trim(),
      publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : new Date(),
      isPublished: dto.isPublished ?? true,
    });
    return this.postRepo.save(post);
  }

  async update(id: string, dto: UpdateBlogPostDto) {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Publicación no encontrada');
    if (dto.title !== undefined) post.title = dto.title.trim();
    if (dto.summary !== undefined) post.summary = dto.summary.trim() || null;
    if (dto.network !== undefined) post.network = dto.network;
    if (dto.category !== undefined) post.category = dto.category.trim() || null;
    if (dto.imageUrl !== undefined) post.imageUrl = dto.imageUrl.trim() || null;
    if (dto.url !== undefined) post.url = dto.url.trim();
    if (dto.publishedAt !== undefined) post.publishedAt = new Date(dto.publishedAt);
    if (dto.isPublished !== undefined) post.isPublished = dto.isPublished;
    return this.postRepo.save(post);
  }

  async remove(id: string) {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Publicación no encontrada');
    await this.postRepo.remove(post);
    return { success: true };
  }

  // ── Suscriptores ───────────────────────────────────────────────────────
  async subscribe(email: string) {
    const limpio = email.trim().toLowerCase();
    const existe = await this.subRepo.exists({ where: { email: limpio } });
    // Misma respuesta exista o no: no se revela quién está suscrito
    if (!existe) await this.subRepo.save(this.subRepo.create({ email: limpio }));
    return { success: true };
  }

  subscribers() {
    return this.subRepo.find({ order: { createdAt: 'DESC' } });
  }
}
