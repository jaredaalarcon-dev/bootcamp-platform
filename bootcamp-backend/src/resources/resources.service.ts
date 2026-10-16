// src/resources/resources.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import * as path from 'path';
import { CourseResource } from './entities/course-resource.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Course } from '../courses/entities/course.entity';
import {
  CreateLinkResourceDto,
  UpdateResourceDto,
  UploadResourceDto,
} from './dto/resource.dto';
import type { ArchivoSubido } from '../upload/upload.service';

// Bucket PRIVADO: los archivos solo se descargan con un enlace temporal firmado.
const BUCKET = 'course-resources';
export const MAX_RESOURCE_MB = 25;
export const EXTENSIONES_PERMITIDAS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.csv', '.zip', '.rar', '.png', '.jpg', '.jpeg',
];
const SEGUNDOS_ENLACE = 60;

interface UsuarioJwt { sub: string; role?: string; }

@Injectable()
export class ResourcesService {
  private supabaseAdmin: SupabaseClient;
  private bucketVerificado = false;

  constructor(
    @InjectRepository(CourseResource)
    private resourceRepo: Repository<CourseResource>,
    @InjectRepository(Enrollment)
    private enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Course)
    private courseRepo: Repository<Course>,
    private configService: ConfigService,
  ) {
    const url = this.configService.get<string>('SUPABASE_URL') ?? '';
    const key =
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ??
      this.configService.get<string>('SUPABASE_KEY') ??
      '';
    this.supabaseAdmin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  // ── Lectura ────────────────────────────────────────────────────────────
  async findByCourse(courseId: string, user: UsuarioJwt) {
    await this.verificarAcceso(courseId, user);
    const recursos = await this.resourceRepo.find({
      where: { courseId },
      order: { orderNumber: 'ASC', createdAt: 'ASC' },
    });
    // Nunca se expone la ruta interna del archivo
    return recursos.map((r) => this.aPublico(r));
  }

  async getDownloadUrl(id: string, user: UsuarioJwt) {
    const recurso = await this.buscar(id);
    await this.verificarAcceso(recurso.courseId, user);

    if (recurso.externalUrl) return { url: recurso.externalUrl };
    if (!recurso.storagePath) throw new NotFoundException('El recurso no tiene archivo');

    const { data, error } = await this.supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(recurso.storagePath, SEGUNDOS_ENLACE, {
        download: recurso.fileName ?? true,
      });
    if (error || !data) {
      throw new InternalServerErrorException('No se pudo generar el enlace de descarga');
    }
    return { url: data.signedUrl };
  }

  // ── Escritura (solo admin) ─────────────────────────────────────────────
  async createLink(dto: CreateLinkResourceDto) {
    await this.verificarCurso(dto.courseId);
    const recurso = this.resourceRepo.create({
      courseId: dto.courseId,
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      type: dto.type ?? 'enlace',
      externalUrl: dto.externalUrl,
      orderNumber: await this.siguienteOrden(dto.courseId),
    });
    return this.aPublico(await this.resourceRepo.save(recurso));
  }

  async upload(dto: UploadResourceDto, file: ArchivoSubido) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    const ext = path.extname(file.originalname).toLowerCase();
    if (!EXTENSIONES_PERMITIDAS.includes(ext)) {
      throw new BadRequestException(
        `Formato no permitido. Usa: ${EXTENSIONES_PERMITIDAS.join(', ')}`,
      );
    }
    if (file.size > MAX_RESOURCE_MB * 1024 * 1024) {
      throw new BadRequestException(`El archivo supera el límite de ${MAX_RESOURCE_MB} MB`);
    }
    await this.verificarCurso(dto.courseId);
    await this.asegurarBucket();

    const storagePath = `${dto.courseId}/${randomUUID()}${ext}`;
    const { error } = await this.supabaseAdmin.storage
      .from(BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype || 'application/octet-stream',
        upsert: false,
      });
    if (error) {
      throw new InternalServerErrorException(`No se pudo subir el archivo: ${error.message}`);
    }

    const recurso = this.resourceRepo.create({
      courseId: dto.courseId,
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      type: dto.type ?? 'guia',
      storagePath,
      fileName: this.nombreSeguro(file.originalname),
      fileSize: file.size,
      mimeType: file.mimetype,
      orderNumber: await this.siguienteOrden(dto.courseId),
    });
    return this.aPublico(await this.resourceRepo.save(recurso));
  }

  async update(id: string, dto: UpdateResourceDto) {
    const recurso = await this.buscar(id);
    if (dto.externalUrl && recurso.storagePath) {
      throw new BadRequestException('Este recurso es un archivo; no se le puede asignar un enlace');
    }
    Object.assign(recurso, {
      ...(dto.title !== undefined && { title: dto.title.trim() }),
      ...(dto.description !== undefined && { description: dto.description.trim() || null }),
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.externalUrl !== undefined && { externalUrl: dto.externalUrl }),
      ...(dto.orderNumber !== undefined && { orderNumber: dto.orderNumber }),
    });
    return this.aPublico(await this.resourceRepo.save(recurso));
  }

  async remove(id: string) {
    const recurso = await this.buscar(id);
    if (recurso.storagePath) {
      // Si el archivo ya no existe en Storage, igual se borra el registro
      await this.supabaseAdmin.storage.from(BUCKET).remove([recurso.storagePath]);
    }
    await this.resourceRepo.remove(recurso);
    return { success: true };
  }

  // ── Utilidades ─────────────────────────────────────────────────────────
  private async verificarAcceso(courseId: string, user: UsuarioJwt) {
    if (user?.role === 'admin') return;
    const inscrito = await this.enrollmentRepo.exists({
      where: { courseId, userId: user.sub },
    });
    if (!inscrito) {
      throw new ForbiddenException('Inscríbete en el curso para ver sus recursos');
    }
  }

  private async verificarCurso(courseId: string) {
    const existe = await this.courseRepo.exists({ where: { id: courseId } });
    if (!existe) throw new NotFoundException('Curso no encontrado');
  }

  private async buscar(id: string) {
    const recurso = await this.resourceRepo.findOne({ where: { id } });
    if (!recurso) throw new NotFoundException('Recurso no encontrado');
    return recurso;
  }

  private async siguienteOrden(courseId: string) {
    const max = await this.resourceRepo.maximum('orderNumber', { courseId });
    return (max ?? 0) + 1;
  }

  private nombreSeguro(nombre: string) {
    return nombre.replace(/[^\w.\- áéíóúÁÉÍÓÚñÑ()]/g, '_').slice(0, 200);
  }

  private aPublico(r: CourseResource) {
    return {
      id: r.id,
      courseId: r.courseId,
      title: r.title,
      description: r.description,
      type: r.type,
      isFile: !!r.storagePath,
      externalUrl: r.externalUrl,
      fileName: r.fileName,
      fileSize: r.fileSize,
      mimeType: r.mimeType,
      orderNumber: r.orderNumber,
      createdAt: r.createdAt,
    };
  }

  private async asegurarBucket() {
    if (this.bucketVerificado) return;
    const { data: buckets } = await this.supabaseAdmin.storage.listBuckets();
    if (!buckets?.some((b) => b.name === BUCKET)) {
      const { error } = await this.supabaseAdmin.storage.createBucket(BUCKET, {
        public: false,
        fileSizeLimit: MAX_RESOURCE_MB * 1024 * 1024,
      });
      if (error && !/already exists/i.test(error.message)) {
        throw new InternalServerErrorException(`No se pudo crear el bucket: ${error.message}`);
      }
    }
    this.bucketVerificado = true;
  }
}
