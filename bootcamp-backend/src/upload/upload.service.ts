// src/upload/upload.service.ts
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

const BUCKET = 'course-images';
const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

@Injectable()
export class UploadService {
  private supabaseAdmin: SupabaseClient;

  constructor(private configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL') ?? '';
    const key =
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ??
      this.configService.get<string>('SUPABASE_KEY') ??
      '';

    this.supabaseAdmin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<{ url: string }> {
    // Validaciones básicas (la mayoría ya las hace Multer, pero doble chequeo)
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }

    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido. Usa: ${ALLOWED_TYPES.join(', ')}`,
      );
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      throw new BadRequestException(
        `El archivo supera el límite de ${MAX_SIZE_MB} MB`,
      );
    }

    // Nombre único para evitar colisiones
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const fileName = `courses/${uuidv4()}${ext}`;

    // Crear el bucket si no existe todavía
    await this.ensureBucket();

    // Subir a Supabase Storage
    const { error } = await this.supabaseAdmin.storage
      .from(BUCKET)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new InternalServerErrorException(
        `No se pudo subir la imagen: ${error.message}`,
      );
    }

    // URL pública (el bucket es público, no necesita token)
    const { data } = this.supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(fileName);

    return { url: data.publicUrl };
  }

  private async ensureBucket() {
    const { data: buckets } = await this.supabaseAdmin.storage.listBuckets();
    const existe = buckets?.some((b) => b.name === BUCKET);

    if (!existe) {
      await this.supabaseAdmin.storage.createBucket(BUCKET, {
        public: true,
        allowedMimeTypes: ALLOWED_TYPES,
        fileSizeLimit: MAX_SIZE_MB * 1024 * 1024,
      });
    }
  }
}
