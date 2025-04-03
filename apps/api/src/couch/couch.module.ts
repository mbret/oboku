import { Module } from "@nestjs/common"
import { CouchService } from "./couch.service"
import { AppConfigService } from "src/config/AppConfigService"
import { JwtService } from "@nestjs/jwt"
import { CouchMigrationService } from "./migration.service"

@Module({
  imports: [],
  providers: [
    CouchService,
    AppConfigService,
    JwtService,
    CouchMigrationService,
  ],
  exports: [CouchService],
})
export class CouchModule {}
