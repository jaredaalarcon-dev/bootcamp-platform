// src/integrations/integrations.module.ts
// Global: cualquier servicio puede inyectar N8nService sin importar el módulo.
import { Global, Module } from '@nestjs/common';
import { N8nService } from './n8n.service';
import { N8nController } from './n8n.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Global()
@Module({
  imports: [NotificationsModule],
  controllers: [N8nController],
  providers: [N8nService],
  exports: [N8nService],
})
export class IntegrationsModule {}
