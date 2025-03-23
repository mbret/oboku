import { Module } from "@nestjs/common"
import { CouchService } from "./couch.service"
import { AppConfigService } from "src/features/config/AppConfigService"
import { JwtService } from "@nestjs/jwt"

@Module({
  imports: [],
  providers: [CouchService, AppConfigService, JwtService],
  exports: [CouchService],
})
export class CouchModule {}
