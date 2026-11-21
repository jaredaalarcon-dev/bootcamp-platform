// src/complaints/complaints.service.ts
// Libro de Reclamaciones virtual: registro de hojas, consulta del consumidor
// y respuesta del proveedor (plazo: 15 días hábiles).
import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Complaint } from './entities/complaint.entity';
import type { TipoBien, TipoReclamo } from './entities/complaint.entity';
import { CreateComplaintDto } from './dto/complaint.dto';

export const PLAZO_DIAS_HABILES = 15;
const MAX_POR_HORA_IP = 5;

/** Suma días hábiles (lunes a viernes). No descuenta feriados: es una referencia. */
export function sumarDiasHabiles(desde: Date, dias: number): Date {
  const d = new Date(desde);
  let sumados = 0;
  while (sumados < dias) {
    d.setDate(d.getDate() + 1);
    const dia = d.getDay();
    if (dia !== 0 && dia !== 6) sumados++;
  }
  return d;
}

@Injectable()
export class ComplaintsService {
  private envios = new Map<string, number[]>();

  constructor(@InjectRepository(Complaint) private repo: Repository<Complaint>) {}

  async create(dto: CreateComplaintDto, meta: { ip?: string; userAgent?: string }) {
    this.limitar(meta.ip);
    const hoja = await this.repo.save(
      this.repo.create({
        fullName: dto.fullName,
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
        address: dto.address,
        phone: dto.phone,
        email: dto.email.toLowerCase(),
        isMinor: dto.isMinor,
        guardianName: dto.isMinor ? (dto.guardianName ?? null) : null,
        itemType: dto.itemType as TipoBien,
        amount: dto.amount != null ? dto.amount.toFixed(2) : null,
        itemDescription: dto.itemDescription,
        type: dto.type as TipoReclamo,
        detail: dto.detail,
        request: dto.request,
        ip: meta.ip?.slice(0, 64) ?? null,
        userAgent: meta.userAgent?.slice(0, 300) ?? null,
        userId: null,
      }),
    );
    // Código correlativo visible (el número lo asigna la base de datos)
    hoja.code = `LR-${hoja.createdAt.getFullYear()}-${String(hoja.numero).padStart(6, '0')}`;
    await this.repo.update({ id: hoja.id }, { code: hoja.code });
    return this.vista(hoja, true);
  }

  /** El consumidor consulta su hoja con el código y su número de documento */
  async consultar(codigo: string, documento: string) {
    const code = (codigo ?? '').trim().toUpperCase();
    const doc = (documento ?? '').replace(/\s+/g, '').toUpperCase();
    if (!/^LR-\d{4}-\d{6}$/.test(code) || doc.length < 6) {
      throw new NotFoundException('No encontramos una hoja con esos datos');
    }
    const hoja = await this.repo.findOne({ where: { code, documentNumber: doc } });
    if (!hoja) throw new NotFoundException('No encontramos una hoja con esos datos');
    return this.vista(hoja, false);
  }

  async list() {
    const hojas = await this.repo.find({ order: { numero: 'DESC' } });
    return hojas.map((h) => ({ ...this.vista(h, true), id: h.id, ip: h.ip }));
  }

  async respond(id: string, response: string) {
    const hoja = await this.repo.findOne({ where: { id } });
    if (!hoja) throw new NotFoundException('Hoja de reclamación no encontrada');
    hoja.response = response;
    hoja.status = 'respondido';
    hoja.respondedAt = new Date();
    await this.repo.save(hoja);
    return { ...this.vista(hoja, true), id: hoja.id };
  }

  // Datos que se muestran. "completa" incluye datos personales (solo al
  // consumidor que acaba de registrar la hoja y al admin).
  private vista(h: Complaint, completa: boolean) {
    const base = {
      code: h.code,
      numero: h.numero,
      type: h.type,
      status: h.status,
      createdAt: h.createdAt,
      deadline: sumarDiasHabiles(h.createdAt, PLAZO_DIAS_HABILES),
      response: h.response,
      respondedAt: h.respondedAt,
      itemType: h.itemType,
      itemDescription: h.itemDescription,
    };
    if (!completa) return base;
    return {
      ...base,
      fullName: h.fullName,
      documentType: h.documentType,
      documentNumber: h.documentNumber,
      address: h.address,
      phone: h.phone,
      email: h.email,
      isMinor: h.isMinor,
      guardianName: h.guardianName,
      amount: h.amount != null ? Number(h.amount) : null,
      detail: h.detail,
      request: h.request,
    };
  }

  private limitar(ip?: string) {
    if (!ip) return;
    const ahora = Date.now();
    const lista = (this.envios.get(ip) ?? []).filter((t) => ahora - t < 3_600_000);
    if (lista.length >= MAX_POR_HORA_IP) {
      throw new HttpException(
        'Registraste varias hojas en poco tiempo. Intenta más tarde o escríbenos por correo.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    lista.push(ahora);
    this.envios.set(ip, lista);
  }
}
