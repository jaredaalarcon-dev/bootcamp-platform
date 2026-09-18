// src/auth/guards/admin-auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Verificar que exista el usuario
    if (!user) {
      throw new ForbiddenException('No autorizado');
    }

    // Verificar que sea admin
    if (user.role !== 'admin') {
      throw new ForbiddenException(
        'Solo administradores pueden acceder a esta sección',
      );
    }

    return true;
  }
}
