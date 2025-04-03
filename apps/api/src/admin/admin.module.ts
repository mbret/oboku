import { Module } from "@nestjs/common"
import { AdminController } from "./admin.controller"
import { AppConfigService } from "src/config/AppConfigService"
import { JwtService } from "@nestjs/jwt"
import { SecretsService } from "src/config/SecretsService"
import { CouchModule } from "src/couch/couch.module"
import { CouchMigrationService } from "src/couch/migration.service"

@Module({
  imports: [CouchModule],
  providers: [
    AppConfigService,
    JwtService,
    SecretsService,
    CouchMigrationService,
  ],
  controllers: [AdminController],
  exports: [],
})
export class AdminModule {}
