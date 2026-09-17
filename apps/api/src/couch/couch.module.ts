import { Module } from "@nestjs/common"
import { CouchService } from "./couch.service"
import { CouchProxyService } from "./couch-proxy.service"
import { UserDbIndexesService } from "./user-db-indexes.service"
import { AppConfigService } from "src/config/AppConfigService"
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
