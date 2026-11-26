// src/notifications/notifications.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { Notification, TipoNotificacion } from './entities/notification.entity';

export interface NuevaNotificacion {
  type: TipoNotificacion;
  title: string;
  message: string;
  link?: string | null;
  /** Si se indica, el mismo aviso no se crea dos veces para el mismo usuario. */
  key?: string | null;
}

const corta = (t: string, n: number) => (t.length > n ? t.slice(0, n - 1) + '…' : t);

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification) private readonly repo: Repository<Notification>,
    @InjectDataSource() private readonly db: DataSource,
  ) {}

  /** Crea un aviso para un usuario. Nunca rompe la operación que lo dispara. */
  async notify(userId: string, n: NuevaNotificacion): Promise<void> {
    try {
      await this.repo
        .createQueryBuilder()
        .insert()
        .into(Notification)
        .values({
          userId,
          type: n.type,
          title: corta(n.title, 160),
          message: n.message,
          link: n.link ?? null,
          key: n.key ?? null,
        })
        .orIgnore()
        .execute();
    } catch (e) {
      this.logger.warn(`No se pudo crear la notificación: ${(e as Error).message}`);
    }
  }

  /** Aviso para todos los alumnos registrados (por ejemplo, un curso nuevo). */
  async notifyAllStudents(n: NuevaNotificacion): Promise<number> {
    try {
      const filas: { id: string }[] = await this.db.query(
        `SELECT p.supabase_id AS id
           FROM profiles p
           LEFT JOIN roles r ON r.id = p.role_id
          WHERE COALESCE(r.name, 'student') <> 'admin'`,
      );
      if (!filas.length) return 0;
      const valores = filas.map((f) => ({
        userId: f.id,
        type: n.type,
        title: corta(n.title, 160),
        message: n.message,
        link: n.link ?? null,
        key: n.key ?? null,
      }));
      for (let i = 0; i < valores.length; i += 500) {
        await this.repo.createQueryBuilder().insert().into(Notification)
          .values(valores.slice(i, i + 500)).orIgnore().execute();
      }
      return filas.length;
    } catch (e) {
      this.logger.warn(`No se pudo avisar a todos: ${(e as Error).message}`);
      return 0;
    }
  }

  async yaExiste(userId: string, key: string) {
    return (await this.repo.count({ where: { userId, key } })) > 0;
  }

  async list(userId: string, limit = 30) {
    const max = Math.min(Math.max(Number(limit) || 30, 1), 100);
    const [items, unread] = await Promise.all([
      this.repo.find({ where: { userId }, order: { createdAt: 'DESC' }, take: max }),
      this.repo.count({ where: { userId, readAt: IsNull() } }),
    ]);
    return { items, unread };
  }

  async unreadCount(userId: string) {
    return { unread: await this.repo.count({ where: { userId, readAt: IsNull() } }) };
  }

  async markRead(userId: string, id: string) {
    const n = await this.repo.findOne({ where: { id, userId } });
    if (!n) throw new NotFoundException('Notificación no encontrada');
    if (!n.readAt) {
      n.readAt = new Date();
      await this.repo.save(n);
    }
    return n;
  }

  async markAllRead(userId: string) {
    const r = await this.repo.update({ userId, readAt: IsNull() }, { readAt: new Date() });
    return { updated: r.affected ?? 0 };
  }

  async remove(userId: string, id: string) {
    const r = await this.repo.delete({ id, userId });
    if (!r.affected) throw new NotFoundException('Notificación no encontrada');
    return { id, eliminado: true };
  }
}
