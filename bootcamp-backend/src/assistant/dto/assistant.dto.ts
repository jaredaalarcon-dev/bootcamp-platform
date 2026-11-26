// src/assistant/dto/assistant.dto.ts
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class ChatDto {
  // Puede venir vacío si la persona tocó un botón (llega "intent")
  @ValidateIf((o: ChatDto) => !o.intent)
  @IsNotEmpty({ message: 'Escribe un mensaje' })
  @IsString()
  @MaxLength(1000, { message: 'El mensaje es muy largo (máximo 1000 caracteres)' })
  message: string;

  // Tema elegido con un botón (respuesta al instante, sin IA)
  @IsOptional()
  @IsString()
  @Matches(/^[a-z_]{2,40}(:[a-zA-Z0-9-]{1,64})?$/, { message: 'Tema inválido' })
  intent?: string;

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

  @IsOptional()
  @IsBoolean()
  aiEnabled?: boolean;
}

export class FaqDto {
  @IsString()
  @IsNotEmpty({ message: 'Escribe la pregunta' })
  @MaxLength(200)
  question: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  variants?: string;

  @IsString()
  @IsNotEmpty({ message: 'Escribe la respuesta' })
  @MaxLength(3000)
  answer: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class TestMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message: string;
}

export class DeleteByContentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;
}
