import { Module } from "@nestjs/common"
import { AdminController } from "./admin.controller.js"
import { AppConfigService } from "../config/AppConfigService.js"
import { JwtService } from "@nestjs/jwt"
import { SecretsService } from "../config/SecretsService.js"
import { CouchModule } from "../couch/couch.module.js"
import { CoversModule } from "../covers/covers.module.js"
import { MigrationModule } from "../migrations/migration.module.js"
import { AdminCoversService } from "./admin-covers.service.js"
import { AdminAuthGuard } from "./admin.guard.js"
import { AuthModule } from "../auth/auth.module.js"
import { InstanceConfigService } from "./instance-config/instance-config.service.js"
import { ServerSourcesService } from "./instance-config/server-sources.service.js"
import { NotificationsModule } from "../notifications/notifications.module.js"
import { EmailModule } from "../email/email.module.js"
import { PostgresModule } from "../features/postgres/postgres.module.js"
import { AdminEmailService } from "./admin-email.service.js"
import { AdminSecurityService } from "./admin-security.service.js"

@Module({
  imports: [
    AuthModule,
    CouchModule,
    CoversModule,
    MigrationModule,
    NotificationsModule,
    EmailModule,
    PostgresModule,
  ],
  providers: [
    AppConfigService,
    JwtService,
    SecretsService,
    AdminCoversService,
    AdminAuthGuard,
    InstanceConfigService,
    ServerSourcesService,
    AdminEmailService,
    AdminSecurityService,
  ],
  controllers: [AdminController],
  exports: [InstanceConfigService],
})
export class AdminModule {}
