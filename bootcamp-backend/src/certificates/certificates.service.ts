// src/certificates/certificates.service.ts
// Certificados y constancias.
//   - Constancia: gratis, para quien completa el 100% del curso.
//   - Certificado: además requiere que el admin marque el pago (coordinado por WhatsApp).
// Cada documento emitido queda registrado con un código para verificarlo en línea.
import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createHash, randomUUID } from 'crypto';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Lesson } from '../courses/entities/lesson.entity';
import { Progress } from '../progress/entities/progress.entity';
import { CertificateProfile } from './entities/certificate-profile.entity';
import { IssuedCertificate } from './entities/issued-certificate.entity';
import type { TipoEmitido } from './entities/issued-certificate.entity';
import { SaveCertificateProfileDto } from './dto/certificate-profile.dto';
import { NotificationsService } from '../notifications/notifications.service';

export interface ArchivoFoto {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const BUCKET_FOTOS = 'certificate-photos';
// ": la foto está borrosa." o "." (para el aviso al alumno)
const conMotivo = (m?: string) => (m?.trim() ? `: ${m.trim().replace(/[.\s]+$/, '')}.` : '.');
export const FOTO_MAX_MB = 3;
export const FOTO_TIPOS = ['image/jpeg', 'image/png', 'image/webp'];
const EXT: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

@Injectable()
export class CertificatesService {
  private readonly logger = new Logger(CertificatesService.name);
  private supabaseAdmin: SupabaseClient;
  private bucketListo = false;

  constructor(
    @InjectRepository(Enrollment)
    private enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Lesson)
    private lessonRepo: Repository<Lesson>,
    @InjectRepository(Progress)
    private progressRepo: Repository<Progress>,
    @InjectRepository(CertificateProfile)
    private perfilRepo: Repository<CertificateProfile>,
    @InjectRepository(IssuedCertificate)
    private emitidoRepo: Repository<IssuedCertificate>,
    private configService: ConfigService,
    private notifications: NotificationsService,
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

  // ════════════════════════════════════════════════════════════════════════
  // Datos del alumno para el certificado
  // ════════════════════════════════════════════════════════════════════════

  async getProfile(userId: string) {
    const perfil = await this.perfilRepo.findOne({ where: { userId } });
    const cuenta = await this.datosCuenta(userId);
    return {
      fullName: perfil?.fullName ?? '',
      documentType: perfil?.documentType ?? 'DNI',
      documentNumber: perfil?.documentNumber ?? '',
      photoUrl: perfil?.photoPath ? await this.urlFoto(perfil.photoPath) : null,
      // Nombre sugerido desde la cuenta, para rellenar el formulario la primera vez
      suggestedName: cuenta.nombre,
      email: cuenta.email,
      complete: Boolean(perfil?.fullName && perfil?.documentNumber && perfil?.photoPath),
      updatedAt: perfil?.updatedAt ?? null,
    };
  }

  async saveProfile(userId: string, dto: SaveCertificateProfileDto) {
    if (dto.documentType === 'DNI' && !/^\d{8}$/.test(dto.documentNumber)) {
      throw new BadRequestException('El DNI debe tener 8 dígitos');
    }
    if (dto.documentType === 'CE' && !/^\d{9,12}$/.test(dto.documentNumber)) {
      throw new BadRequestException('El carné de extranjería debe tener entre 9 y 12 dígitos');
    }

    let perfil = await this.perfilRepo.findOne({ where: { userId } });
    if (!perfil) perfil = this.perfilRepo.create({ userId, photoPath: null });
    perfil.fullName = dto.fullName;
    perfil.documentType = dto.documentType;
    perfil.documentNumber = dto.documentNumber;
    await this.perfilRepo.save(perfil);
    return this.getProfile(userId);
  }

  async uploadPhoto(userId: string, file: ArchivoFoto) {
    if (!file) throw new BadRequestException('No se recibió ninguna imagen');
    if (!FOTO_TIPOS.includes(file.mimetype)) {
      throw new BadRequestException('La foto debe ser JPG, PNG o WEBP');
    }
    if (file.size > FOTO_MAX_MB * 1024 * 1024) {
      throw new BadRequestException(`La foto supera el límite de ${FOTO_MAX_MB} MB`);
    }

    const perfil = await this.perfilRepo.findOne({ where: { userId } });
    if (!perfil) {
      throw new BadRequestException('Primero guarda tu nombre y documento');
    }

    await this.asegurarBucket();
    const ruta = `${userId}/${randomUUID()}${EXT[file.mimetype] ?? '.jpg'}`;
    const { error } = await this.supabaseAdmin.storage
      .from(BUCKET_FOTOS)
      .upload(ruta, file.buffer, { contentType: file.mimetype, upsert: false });
    if (error) {
      throw new InternalServerErrorException(`No se pudo subir la foto: ${error.message}`);
    }

    const anterior = perfil.photoPath;
    perfil.photoPath = ruta;
    await this.perfilRepo.save(perfil);
    if (anterior) await this.borrarArchivo(anterior);
    return this.getProfile(userId);
  }

  async deletePhoto(userId: string) {
    const perfil = await this.perfilRepo.findOne({ where: { userId } });
    if (perfil?.photoPath) {
      await this.borrarArchivo(perfil.photoPath);
      perfil.photoPath = null;
      await this.perfilRepo.save(perfil);
    }
    return this.getProfile(userId);
  }

  // ════════════════════════════════════════════════════════════════════════
  // Estado de certificados de cada curso del alumno
  // ════════════════════════════════════════════════════════════════════════

  async mySummary(userId: string) {
    const inscripciones = await this.enrollmentRepo.find({ where: { userId } });
    const emitidos = await this.emitidoRepo.find({ where: { userId, revoked: false } });
    const perfil = await this.perfilRepo.findOne({ where: { userId } });
    const examenes = await Promise.all(inscripciones.map((i) => this.examenFinal(userId, i.courseId)));
    return {
      profileComplete: Boolean(perfil?.fullName && perfil?.documentNumber && perfil?.photoPath),
      // Nombre y documento: lo mínimo para la constancia
      profileBasic: Boolean(perfil?.fullName && perfil?.documentNumber),
      courses: inscripciones.map((i, k) => ({
        courseId: i.courseId,
        paid: i.paid,
        paidAt: i.paidAt,
        finalExam: examenes[k],
        issued: emitidos
          .filter((e) => e.courseId === i.courseId)
          .map((e) => ({ type: e.type, code: e.code, createdAt: e.createdAt })),
      })),
    };
  }

  // ════════════════════════════════════════════════════════════════════════
  // Emitir / ver un certificado o constancia
  // ════════════════════════════════════════════════════════════════════════

  async getCertificate(userId: string, courseId: string, tipoPedido?: string) {
    // 1. Inscripción
    const enrollment = await this.enrollmentRepo.findOne({
      where: { userId, courseId },
      relations: { course: { category: true } },
    });
    if (!enrollment) throw new NotFoundException('No estás inscrito en este curso');

    // 2. Progreso al 100%
    const totalLessons = await this.lessonRepo.count({
      where: { module: { course: { id: courseId } } },
    });
    const completed = await this.progressRepo.count({
      where: { userId, status: 'completed', lesson: { module: { course: { id: courseId } } } },
    });
    const percentage = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;
    if (percentage < 100) {
      throw new ForbiddenException(
        `Debes completar el 100% del curso para obtener tu documento. Llevas ${percentage}%.`,
      );
    }

    // 3. Tipo de documento: el certificado solo si el pago está confirmado
    const tipo: TipoEmitido =
      tipoPedido === 'constancia' ? 'constancia' : enrollment.paid ? 'certificado' : 'constancia';
    if (tipoPedido === 'certificado' && !enrollment.paid) {
      throw new ForbiddenException(
        'El certificado oficial se habilita cuando se confirma el pago. Escríbenos por WhatsApp para solicitarlo. Mientras tanto puedes descargar tu constancia gratuita.',
      );
    }

    // Un documento ya emitido se sigue mostrando aunque luego cambien las reglas
    const yaEmitido = await this.emitidoRepo.findOne({ where: { userId, courseId, type: tipo } });

    // 3b. Examen final aprobado (si el curso tiene uno)
    if (!yaEmitido) {
      const examen = await this.examenFinal(userId, courseId);
      if (examen && !examen.passed) {
        throw new ForbiddenException({
          statusCode: 403,
          code: 'EXAMEN_FINAL',
          quizId: examen.quizId,
          message: `Para obtener tu ${tipo === 'certificado' ? 'certificado' : 'constancia'} aprueba el examen final del curso (nota mínima ${examen.passingScore} %).`,
        });
      }
    }

    // 4. Datos del alumno (los del perfil de certificado tienen prioridad)
    const perfil = await this.perfilRepo.findOne({ where: { userId } });
    if (tipo === 'certificado' && !(perfil?.fullName && perfil?.documentNumber && perfil?.photoPath)) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'PERFIL_INCOMPLETO',
        message: 'Para emitir tu certificado completa primero tus datos y tu foto formal en «Mi perfil».',
      });
    }
    if (tipo === 'constancia' && !yaEmitido && !(perfil?.fullName && perfil?.documentNumber)) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'PERFIL_INCOMPLETO',
        message: 'Para emitir tu constancia completa tu nombre completo y tu documento de identidad en «Mi perfil».',
      });
    }
    const cuenta = await this.datosCuenta(userId);
    const nombre = perfil?.fullName || cuenta.nombre;
    const documento = perfil?.documentNumber
      ? `${perfil.documentType === 'PASAPORTE' ? 'Pasaporte' : perfil.documentType} ${perfil.documentNumber}`
      : null;

    // 5. Registro del documento emitido (se crea una sola vez y no cambia)
    let emitido = yaEmitido;
    if (!emitido) {
      const fin = await this.fechaFinalizacion(userId, courseId);
      emitido = this.emitidoRepo.create({
        code: this.codigo(tipo, userId, courseId),
        type: tipo,
        userId,
        courseId,
        studentName: nombre,
        documentLabel: documento,
        courseName: enrollment.course.title,
        completedAt: fin ?? enrollment.updatedAt ?? new Date(),
      });
      emitido = await this.emitidoRepo.save(emitido);
    } else if (!emitido.revoked && perfil?.fullName && (emitido.studentName !== nombre || emitido.documentLabel !== documento)) {
      // El alumno corrigió sus datos: el documento se actualiza con el mismo código
      emitido.studentName = nombre;
      emitido.documentLabel = documento;
      emitido = await this.emitidoRepo.save(emitido);
    }
    if (emitido.revoked) {
      throw new ForbiddenException('Este documento fue anulado. Comunícate con nosotros por WhatsApp.');
    }

    return {
      type: tipo,
      certificateId: emitido.code,
      studentName: emitido.studentName,
      document: emitido.documentLabel,
      photoUrl: perfil?.photoPath ? await this.urlFoto(perfil.photoPath) : null,
      courseName: emitido.courseName,
      courseCategory: enrollment.course.category?.name ?? '',
      courseImage: enrollment.course.image ?? '',
      completedAt: emitido.completedAt,
      issuedAt: emitido.createdAt,
      totalLessons,
      percentage,
      paid: enrollment.paid,
      finalExamScore: (await this.examenFinal(userId, courseId))?.bestScore ?? null,
    };
  }

  // Verificación pública por código (sin iniciar sesión)
  async verify(codigo: string) {
    const code = (codigo ?? '').trim().toUpperCase();
    if (!/^SIJB-[A-Z]{2}-[A-F0-9]{10}$/.test(code)) {
      return { valid: false };
    }
    const emitido = await this.emitidoRepo.findOne({ where: { code } });
    if (!emitido || emitido.revoked) return { valid: false };
    return {
      valid: true,
      code: emitido.code,
      type: emitido.type,
      studentName: emitido.studentName,
      document: this.ocultarDocumento(emitido.documentLabel),
      courseName: emitido.courseName,
      completedAt: emitido.completedAt,
      issuedAt: emitido.createdAt,
    };
  }

  // ════════════════════════════════════════════════════════════════════════
  // Ayudantes
  // ════════════════════════════════════════════════════════════════════════

  /** Examen final publicado del curso y si el alumno ya lo aprobó (null si no hay). */
  async examenFinal(userId: string, courseId: string) {
    const [q] = await this.enrollmentRepo.manager.query(
      `SELECT q.id, q.title, q."passingScore",
              EXISTS (SELECT 1 FROM quiz_attempts a WHERE a."quizId" = q.id AND a."userId" = $1 AND a.passed) AS passed,
              (SELECT MAX(a.score)::int FROM quiz_attempts a WHERE a."quizId" = q.id AND a."userId" = $1) AS "bestScore"
         FROM quizzes q
        WHERE q."courseId" = $2 AND q."moduleId" IS NULL AND q."lessonId" IS NULL AND q.published = true
          AND EXISTS (SELECT 1 FROM quiz_questions qq WHERE qq."quizId" = q.id)
        LIMIT 1`,
      [userId, courseId],
    );
    return q
      ? { quizId: q.id as string, title: q.title as string, passingScore: q.passingScore as number, passed: !!q.passed, bestScore: q.bestScore as number | null }
      : null;
  }

  // SIJB-CE-xxxxxxxxxx (certificado) o SIJB-CO-xxxxxxxxxx (constancia).
  // Determinista: el mismo alumno y curso siempre generan el mismo código.
  private codigo(tipo: TipoEmitido, userId: string, courseId: string) {
    const hash = createHash('sha256').update(`${tipo}|${userId}|${courseId}`).digest('hex');
    return `SIJB-${tipo === 'certificado' ? 'CE' : 'CO'}-${hash.slice(0, 10).toUpperCase()}`;
  }

  // "DNI 71234567" → "DNI ****4567"
  private ocultarDocumento(doc: string | null) {
    if (!doc) return null;
    const partes = doc.split(' ');
    const num = partes.pop() ?? '';
    return `${partes.join(' ')} ${'*'.repeat(Math.max(0, num.length - 4))}${num.slice(-4)}`.trim();
  }

  private async fechaFinalizacion(userId: string, courseId: string): Promise<Date | null> {
    const fila = await this.progressRepo
      .createQueryBuilder('p')
      .innerJoin('p.lesson', 'l')
      .innerJoin('l.module', 'm')
      .select('MAX(p.completedAt)', 'fin')
      .where('p.userId = :userId', { userId })
      .andWhere('m.courseId = :courseId', { courseId })
      .andWhere("p.status = 'completed'")
      .getRawOne<{ fin: Date | null }>();
    return fila?.fin ? new Date(fila.fin) : null;
  }

  private async datosCuenta(userId: string) {
    const { data: profile } = await this.supabaseAdmin
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('supabase_id', userId)
      .single();
    const nombre =
      profile?.first_name || profile?.last_name
        ? `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim()
        : (profile?.email?.split('@')[0] ?? 'Estudiante');
    return { nombre, email: (profile?.email as string | undefined) ?? '' };
  }

  // URL firmada (la foto es privada; el enlace caduca en 1 hora)
  // ════════════════════════════════════════════════════════════════════════
  // Admin: datos de los alumnos para constancias y certificados
  // ════════════════════════════════════════════════════════════════════════

  async adminDatos() {
    const filas: {
      userId: string; email: string; firstName: string | null; lastName: string | null; registeredAt: Date;
      fullName: string | null; documentType: string | null; documentNumber: string | null; photoPath: string | null;
      updatedAt: Date | null; completados: number; constancias: number; certificados: number;
    }[] = await this.enrollmentRepo.manager.query(
      `SELECT p.supabase_id AS "userId", p.email, p.first_name AS "firstName", p.last_name AS "lastName",
              p.created_at AS "registeredAt",
              cp."fullName", cp."documentType", cp."documentNumber", cp."photoPath", cp."updatedAt",
              (SELECT COUNT(*)::int FROM enrollments e WHERE e."userId"::text = p.supabase_id::text AND e.status = 'completed') AS completados,
              (SELECT COUNT(*)::int FROM issued_certificates ic WHERE ic."userId"::text = p.supabase_id::text AND ic.type = 'constancia' AND NOT ic.revoked) AS constancias,
              (SELECT COUNT(*)::int FROM issued_certificates ic WHERE ic."userId"::text = p.supabase_id::text AND ic.type = 'certificado' AND NOT ic.revoked) AS certificados
         FROM profiles p
         LEFT JOIN roles r ON r.id = p.role_id
         LEFT JOIN certificate_profiles cp ON cp."userId"::text = p.supabase_id::text
        WHERE COALESCE(r.name, 'student') <> 'admin'
        ORDER BY (cp."fullName" IS NULL), cp."updatedAt" DESC NULLS LAST, p.created_at DESC`,
    );
    // Fotos: enlaces firmados en un solo pedido (vencen en 1 hora)
    const rutas = filas.map((f) => f.photoPath).filter((r): r is string => !!r);
    const urls = new Map<string, string>();
    if (rutas.length) {
      const { data } = await this.supabaseAdmin.storage.from(BUCKET_FOTOS).createSignedUrls(rutas, 60 * 60);
      data?.forEach((d) => { if (d.path && d.signedUrl) urls.set(d.path, d.signedUrl); });
    }
    const items = filas.map((f) => ({
      userId: f.userId,
      email: f.email,
      accountName: [f.firstName, f.lastName].filter(Boolean).join(' ') || f.email.split('@')[0],
      registeredAt: f.registeredAt,
      fullName: f.fullName,
      documentType: f.documentType,
      documentNumber: f.documentNumber,
      photoUrl: f.photoPath ? urls.get(f.photoPath) ?? null : null,
      hasPhoto: !!f.photoPath,
      updatedAt: f.updatedAt,
      basic: !!(f.fullName && f.documentNumber),
      complete: !!(f.fullName && f.documentNumber && f.photoPath),
      completedCourses: f.completados,
      constancias: f.constancias,
      certificados: f.certificados,
    }));
    return {
      total: items.length,
      conDatos: items.filter((i) => i.basic).length,
      conFoto: items.filter((i) => i.complete).length,
      items,
    };
  }

  /** El admin borra una foto mal subida; el alumno recibe un aviso para subir otra. */
  async adminBorrarFoto(userId: string, motivo?: string) {
    const perfil = await this.perfilAdmin(userId);
    if (!perfil.photoPath) throw new BadRequestException('Este alumno no tiene foto registrada');
    await this.borrarArchivo(perfil.photoPath);
    perfil.photoPath = null;
    await this.perfilRepo.save(perfil);
    await this.notifications.notify(userId, {
      type: 'certificado',
      title: 'Vuelve a subir tu foto para el certificado',
      message: `Tu foto fue retirada porque no cumple los requisitos${conMotivo(motivo)} Sube una foto formal tipo carné en «Mi perfil».`,
      link: '/profile',
    });
    return { userId, borrado: 'foto' as const };
  }

  /** El admin borra nombre, documento y foto mal registrados; el alumno debe llenarlos de nuevo. */
  async adminBorrarDatos(userId: string, motivo?: string) {
    const perfil = await this.perfilAdmin(userId);
    if (perfil.photoPath) await this.borrarArchivo(perfil.photoPath);
    await this.perfilRepo.remove(perfil);
    await this.notifications.notify(userId, {
      type: 'certificado',
      title: 'Vuelve a registrar tus datos para la constancia',
      message: `Tus datos para la constancia y el certificado fueron borrados porque había un error${conMotivo(motivo)} Escribe otra vez tu nombre completo y tu documento en «Mi perfil».`,
      link: '/profile',
    });
    return { userId, borrado: 'datos' as const };
  }

  private async perfilAdmin(userId: string) {
    if (!/^[0-9a-f-]{36}$/i.test(userId ?? '')) throw new BadRequestException('Alumno no válido');
    const perfil = await this.perfilRepo.findOne({ where: { userId } });
    if (!perfil) throw new NotFoundException('Este alumno aún no registró sus datos');
    return perfil;
  }

  private async urlFoto(ruta: string) {
    const { data, error } = await this.supabaseAdmin.storage
      .from(BUCKET_FOTOS)
      .createSignedUrl(ruta, 60 * 60);
    if (error) {
      this.logger.warn(`No se pudo firmar la foto: ${error.message}`);
      return null;
    }
    return data.signedUrl;
  }

  private async borrarArchivo(ruta: string) {
    const { error } = await this.supabaseAdmin.storage.from(BUCKET_FOTOS).remove([ruta]);
    if (error) this.logger.warn(`No se pudo borrar la foto anterior: ${error.message}`);
  }

  private async asegurarBucket() {
    if (this.bucketListo) return;
    const { data: buckets } = await this.supabaseAdmin.storage.listBuckets();
    if (!buckets?.some((b) => b.name === BUCKET_FOTOS)) {
      const { error } = await this.supabaseAdmin.storage.createBucket(BUCKET_FOTOS, {
        public: false,
        allowedMimeTypes: FOTO_TIPOS,
        fileSizeLimit: FOTO_MAX_MB * 1024 * 1024,
      });
      if (error) {
        throw new InternalServerErrorException(`No se pudo preparar el almacenamiento: ${error.message}`);
      }
    }
    this.bucketListo = true;
  }
}
