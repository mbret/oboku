import { Module } from "@nestjs/common"
import { AdminController } from "./admin.controller.js"
import { AppConfigService } from "../config/AppConfigService.js"
import { JwtService } from "@nestjs/jwt"
import { CouchModule } from "../couch/couch.module.js"
import { CoversModule } from "../covers/covers.module.js"
import { MigrationModule } from "../migrations/migration.module.js"
import { AdminCoversService } from "./admin-covers.service.js"
import { AdminAuthGuard } from "./admin.guard.js"
import { AuthModule } from "../auth/auth.module.js"
import { InstanceConfigModule } from "./instance-config/instance-config.module.js"
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
    InstanceConfigModule,
  ],
  providers: [
    AppConfigService,
    JwtService,
    AdminCoversService,
    AdminAuthGuard,
    AdminEmailService,
    AdminSecurityService,
  ],
  controllers: [AdminController],
})
export class AdminModule {}
