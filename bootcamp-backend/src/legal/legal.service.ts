// src/legal/legal.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TermsAcceptance } from './entities/terms-acceptance.entity';
import { TERMS_VERSION } from './legal.constants';

interface Origen {
  source: 'registro' | 'inicio_sesion';
  ip?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class LegalService {
  constructor(
    @InjectRepository(TermsAcceptance)
    private readonly aceptaciones: Repository<TermsAcceptance>,
  ) {}

  /** ¿El usuario ya aceptó la versión vigente? */
  async status(userId: string) {
    const ultima = await this.aceptaciones.findOne({
      where: { userId, version: TERMS_VERSION },
      order: { createdAt: 'DESC' },
    });
    return {
      currentVersion: TERMS_VERSION,
      accepted: !!ultima,
      acceptedAt: ultima?.createdAt ?? null,
    };
  }

  /** Guarda la aceptación de la versión vigente (si ya existe, no la duplica). */
  async accept(userId: string, version: string, origen: Origen) {
    if (version !== TERMS_VERSION) {
      throw new BadRequestException(
        'Los términos se actualizaron. Recarga la página y vuelve a aceptarlos.',
      );
    }
    const actual = await this.status(userId);
    if (actual.accepted) return actual;
    await this.aceptaciones.save(
      this.aceptaciones.create({
        userId,
        version: TERMS_VERSION,
        source: origen.source,
        ip: origen.ip?.slice(0, 64) ?? null,
        userAgent: origen.userAgent?.slice(0, 300) ?? null,
      }),
    );
    return this.status(userId);
  }
}
