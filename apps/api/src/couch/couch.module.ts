import { Module } from "@nestjs/common"
import { CouchService } from "./couch.service.js"
import { CouchProxyService } from "./couch-proxy.service.js"
import { UserDbIndexesService } from "./user-db-indexes.service.js"
import { AppConfigService } from "../config/AppConfigService.js"
import { JwtService } from "@nestjs/jwt"

@Module({
  imports: [],
  providers: [
    CouchService,
    CouchProxyService,
    UserDbIndexesService,
    AppConfigService,
    JwtService,
  ],
  exports: [CouchService, CouchProxyService, UserDbIndexesService],
})
export class CouchModule {}
