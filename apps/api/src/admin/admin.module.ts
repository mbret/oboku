import { Module } from "@nestjs/common"
import { AdminController } from "./admin.controller"
import { AppConfigService } from "src/config/AppConfigService"
import { JwtService } from "@nestjs/jwt"
import { SecretsService } from "src/config/SecretsService"
import { CouchModule } from "src/couch/couch.module"
import { CouchMigrationService } from "src/couch/migration.service"
import { CoversModule } from "src/covers/covers.module"
import { AdminCoversService } from "./admin-covers.service"
import { AdminAuthGuard } from "./admin.guard"
import { AuthModule } from "src/auth/auth.module"
import { InstanceConfigService } from "./instance-config/instance-config.service"
import { ServerSourcesService } from "./instance-config/server-sources.service"
import { NotificationsModule } from "src/notifications/notifications.module"

@Module({
  imports: [AuthModule, CouchModule, CoversModule, NotificationsModule],
  providers: [
    AppConfigService,
    JwtService,
    SecretsService,
    CouchMigrationService,
    AdminCoversService,
    AdminAuthGuard,
    InstanceConfigService,
    ServerSourcesService,
  ],
  controllers: [AdminController],
  exports: [InstanceConfigService],
})
export class AdminModule {}
