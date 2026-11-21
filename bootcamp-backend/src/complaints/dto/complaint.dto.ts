// src/complaints/dto/complaint.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { TIPOS_BIEN, TIPOS_RECLAMO } from '../entities/complaint.entity';

const limpiar = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateComplaintDto {
  @ApiProperty() @Transform(limpiar) @IsString() @Length(5, 150, { message: 'Escribe tus nombres y apellidos' })
  fullName: string;

  @ApiProperty({ enum: ['DNI', 'CE', 'PASAPORTE', 'RUC'] })
  @IsIn(['DNI', 'CE', 'PASAPORTE', 'RUC'], { message: 'Tipo de documento no válido' })
  documentType: string;

  @ApiProperty()
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\s+/g, '').toUpperCase() : value))
  @IsString()
  @Length(6, 20, { message: 'Número de documento no válido' })
  @Matches(/^[A-Z0-9-]+$/, { message: 'El documento solo puede tener letras y números' })
  documentNumber: string;

  @ApiProperty() @Transform(limpiar) @IsString() @Length(5, 250, { message: 'Escribe tu domicilio' })
  address: string;

  @ApiProperty()
  @Transform(limpiar)
  @IsString()
  @Matches(/^[0-9+\s()-]{6,20}$/, { message: 'Teléfono no válido' })
  phone: string;

  @ApiProperty() @Transform(limpiar) @IsEmail({}, { message: 'Correo no válido' }) @MaxLength(150)
  email: string;

  @ApiProperty() @IsBoolean()
  isMinor: boolean;

  @ApiPropertyOptional()
  @ValidateIf((o: CreateComplaintDto) => o.isMinor)
  @Transform(limpiar)
  @IsString()
  @Length(5, 150, { message: 'Escribe el nombre del padre, madre o apoderado' })
  guardianName?: string;

  @ApiProperty({ enum: TIPOS_BIEN }) @IsIn(TIPOS_BIEN as unknown as string[], { message: 'Indica si es producto o servicio' })
  itemType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Monto no válido' })
  @Min(0)
  @Max(1_000_000)
  amount?: number | null;

  @ApiProperty() @Transform(limpiar) @IsString() @Length(3, 1000, { message: 'Describe el producto o servicio' })
  itemDescription: string;

  @ApiProperty({ enum: TIPOS_RECLAMO }) @IsIn(TIPOS_RECLAMO as unknown as string[], { message: 'Elige reclamo o queja' })
  type: string;

  @ApiProperty() @Transform(limpiar) @IsString() @Length(10, 3000, { message: 'Detalla lo ocurrido (mínimo 10 caracteres)' })
  detail: string;

  @ApiProperty() @Transform(limpiar) @IsString() @Length(5, 2000, { message: 'Indica qué solicitas' })
  request: string;

  @ApiProperty() @Equals(true, { message: 'Debes declarar que los datos son verdaderos' })
  accepted: boolean;
}

export class RespondComplaintDto {
  @ApiProperty() @Transform(limpiar) @IsString() @IsNotEmpty({ message: 'Escribe la respuesta' }) @MaxLength(5000)
  response: string;
}
