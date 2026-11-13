// src/assistant/dto/assistant.dto.ts
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class ChatDto {
  @IsNotEmpty({ message: 'Escribe un mensaje' })
  @IsString()
  @MaxLength(1000, { message: 'El mensaje es muy largo (máximo 1000 caracteres)' })
  message: string;

  // Id aleatorio que genera el navegador para recordar la conversación
  @IsString()
  @Matches(/^[a-zA-Z0-9-]{8,64}$/, { message: 'Conversación inválida' })
  conversationId: string;

  // Nombre del alumno si tiene sesión, para saludarlo por su nombre
  @IsOptional()
  @IsString()
  @MaxLength(60)
  userName?: string;
}

export class UpdateAssistantSettingsDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  knowledge?: string;
}
