import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL') || '';
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY') || '';

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async register(registerDto: RegisterDto) {
    const { email, password } = registerDto;

    try {
      // Crear usuario en Supabase Auth
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
      });

      if (error || !data.user) {
        throw new BadRequestException(
          error?.message || 'Error al registrar usuario',
        );
      }

      const user = data.user;

      return {
        id: user.id,
        email: user.email,
        message:
          'Usuario registrado exitosamente. Por favor confirma tu email.',
      };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    try {
      // Autenticar con Supabase
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      const user = data.user;
      const session = data.session;

      // Generar JWT token
      const token = this.jwtService.sign({
        sub: user.id,
        email: user.email,
        iat: Math.floor(Date.now() / 1000),
      });

      return {
        accessToken: token,
        refreshToken: session?.refresh_token,
        user: {
          id: user.id,
          email: user.email,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const { data, error } = await this.supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error || !data.user) {
        throw new UnauthorizedException('No se pudo renovar la sesión');
      }

      const newToken = this.jwtService.sign({
        sub: data.user.id,
        email: data.user.email,
      });

      return {
        accessToken: newToken,
        refreshToken: data.session?.refresh_token,
      };
    } catch (error) {
      throw new UnauthorizedException('Token de actualización inválido');
    }
  }

  async logout(userId: string) {
    return { message: 'Sesión cerrada exitosamente' };
  }

  async resetPassword(email: string) {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email);

      if (error) {
        throw new BadRequestException(error.message);
      }

      return { message: 'Correo de recuperación enviado' };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
