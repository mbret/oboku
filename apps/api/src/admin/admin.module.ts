import { Module } from "@nestjs/common"
import { AdminController } from "./admin.controller"
import { AppConfigService } from "src/config/AppConfigService"
import { JwtService } from "@nestjs/jwt"
import { SecretsService } from "src/config/SecretsService"
import { CouchModule } from "src/couch/couch.module"
import { CouchMigrationService } from "src/couch/migration.service"
import { CoversModule } from "src/covers/covers.module"
import { AdminCoversService } from "./admin-covers.service"

@Module({
  imports: [CouchModule, CoversModule],
  providers: [
    AppConfigService,
    JwtService,
    SecretsService,
    CouchMigrationService,
    AdminCoversService,
  ],
  controllers: [AdminController],
  exports: [],
})
export class AdminModule {}
