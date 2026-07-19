import { Module } from "@nestjs/common"
import { CouchService } from "./couch.service"
import { CouchProxyService } from "./couch-proxy.service"
import { AppConfigService } from "src/config/AppConfigService"
import { JwtService } from "@nestjs/jwt"

@Module({
  imports: [],
  providers: [CouchService, CouchProxyService, AppConfigService, JwtService],
  exports: [CouchService, CouchProxyService],
})
export class CouchModule {}
