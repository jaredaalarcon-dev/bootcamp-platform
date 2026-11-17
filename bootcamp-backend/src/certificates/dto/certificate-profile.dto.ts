// src/certificates/dto/certificate-profile.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { TIPOS_DOCUMENTO } from '../entities/certificate-profile.entity';
import type { TipoDocumento } from '../entities/certificate-profile.entity';

const limpiar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : value;

export class SaveCertificateProfileDto {
  @ApiProperty({ example: 'María Fernanda Quispe Rojas' })
  @Transform(limpiar)
  @IsString()
  @Length(5, 150, { message: 'Escribe tu nombre completo (nombres y apellidos)' })
  @Matches(/^[\p{L}][\p{L} .'-]+$/u, { message: 'El nombre solo puede tener letras y espacios' })
  fullName: string;

  @ApiProperty({ enum: TIPOS_DOCUMENTO, example: 'DNI' })
  @IsIn(TIPOS_DOCUMENTO as unknown as string[], { message: 'Tipo de documento no válido' })
  documentType: TipoDocumento;

  @ApiProperty({ example: '71234567' })
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\s+/g, '').toUpperCase() : value))
  @IsString()
  @Length(6, 20, { message: 'Número de documento no válido' })
  @Matches(/^[A-Z0-9-]+$/, { message: 'El documento solo puede tener letras y números' })
  documentNumber: string;
}
