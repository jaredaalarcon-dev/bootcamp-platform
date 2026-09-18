import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;
  // Cliente con service role: se salta las políticas RLS.
  // Hace falta para crear el perfil, porque en ese momento
  // el usuario todavía no tiene sesión iniciada.
  private supabaseAdmin: SupabaseClient;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL') || '';
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY') || '';
    const serviceRoleKey =
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || '';

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey || supabaseKey,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  }

  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName } = registerDto;

    // PASO 1: crear el usuario en Supabase Auth
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error || !data.user) {
      throw new BadRequestException(
        error?.message || 'No se pudo registrar el usuario',
      );
    }

    // Supabase devuelve un usuario con identities vacías cuando
    // el correo ya estaba registrado, en vez de dar error.
    if (data.user.identities && data.user.identities.length === 0) {
      throw new BadRequestException('Ya existe una cuenta con ese correo');
    }

    const user = data.user;

    // PASO 2: buscar el rol por defecto
    const { data: rolEstudiante } = await this.supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', 'student')
      .maybeSingle();

    // PASO 3: crear el perfil. Sin esta fila el login nunca funciona,
    // porque login() busca el perfil por supabase_id.
    const { error: perfilError } = await this.supabaseAdmin
      .from('profiles')
      .insert({
        supabase_id: user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        role_id: rolEstudiante?.id ?? null,
      });

    if (perfilError) {
      // Si el perfil falla, el usuario de Auth queda inservible y además
      // bloquea el correo. Lo borramos para que pueda reintentar.
      await this.supabaseAdmin.auth.admin.deleteUser(user.id);
      throw new BadRequestException(
        `No se pudo crear el perfil: ${perfilError.message}`,
      );
    }

    return {
      id: user.id,
      email: user.email,
      message: 'Usuario registrado exitosamente. Por favor confirma tu email.',
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      const user = data.user;
      const session = data.session;

      // PASO 1: Obtener perfil del usuario
      const { data: profileData, error: profileError } = await this.supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role_id')
        .eq('supabase_id', user.id)
        .single();

      if (profileError || !profileData) {
        throw new UnauthorizedException(
          'Tu cuenta no tiene un perfil asociado. Contacta al administrador.',
        );
      }

      // PASO 2: Obtener el nombre del rol usando role_id
      let roleName = 'student'; // rol por defecto

      if (profileData.role_id) {
        const { data: roleData } = await this.supabase
          .from('roles')
          .select('name')
          .eq('id', profileData.role_id)
          .single();

        if (roleData && roleData.name) {
          roleName = roleData.name;
        }
      }

      // PASO 3: Generar JWT token CON EL ROL
      const token = this.jwtService.sign({
        sub: user.id,
        email: user.email,
        role: roleName,
        iat: Math.floor(Date.now() / 1000),
      });

      return {
        accessToken: token,
        refreshToken: session?.refresh_token,
        user: {
          id: user.id,
          email: user.email,
          firstName: profileData.first_name,
          lastName: profileData.last_name,
          role: roleName,
        },
      };
    } catch (error) {
      // Si ya es un error HTTP con su mensaje, lo dejamos pasar tal cual.
      // Antes todo se convertía en "Credenciales inválidas" y era imposible
      // distinguir una contraseña mala de un perfil que no existe.
      if (error instanceof HttpException) {
        throw error;
      }
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

      // El rol tiene que viajar también en el token renovado, si no
      // el usuario pierde sus permisos al refrescar la sesión.
      let roleName = 'student';

      const { data: profileData } = await this.supabase
        .from('profiles')
        .select('role_id')
        .eq('supabase_id', data.user.id)
        .maybeSingle();

      if (profileData?.role_id) {
        const { data: roleData } = await this.supabase
          .from('roles')
          .select('name')
          .eq('id', profileData.role_id)
          .single();

        if (roleData?.name) {
          roleName = roleData.name;
        }
      }

      const newToken = this.jwtService.sign({
        sub: data.user.id,
        email: data.user.email,
        role: roleName,
      });

      return {
        accessToken: newToken,
        refreshToken: data.session?.refresh_token,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
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
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }
}
