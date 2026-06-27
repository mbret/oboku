import { Module } from "@nestjs/common"
import { AdminController } from "./admin.controller"
import { AppConfigService } from "src/config/AppConfigService"
import { JwtService } from "@nestjs/jwt"
import { SecretsService } from "src/config/SecretsService"
import { CouchModule } from "src/couch/couch.module"
import { CoversModule } from "src/covers/covers.module"
import { MigrationModule } from "src/migrations/migration.module"
import { AdminCoversService } from "./admin-covers.service"
import { AdminAuthGuard } from "./admin.guard"
import { AuthModule } from "src/auth/auth.module"
import { InstanceConfigService } from "./instance-config/instance-config.service"
import { ServerSourcesService } from "./instance-config/server-sources.service"
import { NotificationsModule } from "src/notifications/notifications.module"
import { EmailModule } from "src/email/email.module"
import { PostgresModule } from "src/features/postgres/postgres.module"
import { AdminEmailService } from "./admin-email.service"

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
  ],
  controllers: [AdminController],
  exports: [InstanceConfigService],
})
export class AdminModule {}
