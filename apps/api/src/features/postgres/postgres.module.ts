import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { SyncReportPostgresService } from "./SyncReportPostgresService"
import { AppConfigService } from "../../config/AppConfigService"
import {
  CommunicationPostgresEntity,
  // RefreshTokenPostgresEntity,
  SyncReportPostgresEntity,
  UserPostgresEntity,
} from "./entities"
import { CommunicationPostgresService } from "./CommunicationPostgresService"
import { RefreshTokensService } from "./refreshTokens.service"
import { JwtService } from "@nestjs/jwt"

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SyncReportPostgresEntity,
      CommunicationPostgresEntity,
      UserPostgresEntity,
      // RefreshTokenPostgresEntity,
    ]),
  ],
  providers: [
    SyncReportPostgresService,
    AppConfigService,
    CommunicationPostgresService,
    RefreshTokensService,
    JwtService,
  ],
  exports: [TypeOrmModule, RefreshTokensService, SyncReportPostgresService],
})
export class PostgresModule {}
