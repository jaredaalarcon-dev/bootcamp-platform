import { IsEmail, IsString, MinLength, IsNotEmpty, Equals, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: true, description: 'Debe ser true: acepta Términos y Política de Privacidad' })
  @Equals(true, { message: 'Debes aceptar los Términos y Condiciones y la Política de Privacidad' })
  acceptTerms: boolean;

  @ApiProperty({ example: '2026-11-17', description: 'Versión de los términos que el usuario aceptó' })
  @IsString()
  @MaxLength(20)
  termsVersion: string;
}
