import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { NotificationPostgresService } from "./notification-postgres.service.js"
import { SyncReportPostgresService } from "./SyncReportPostgresService.js"
import { AppConfigService } from "../../config/AppConfigService.js"
import {
  KoreaderSyncCredentialPostgresEntity,
  KoreaderSyncProgressPostgresEntity,
  NotificationDeliveryPostgresEntity,
  NotificationPostgresEntity,
  RefreshTokenPostgresEntity,
  SyncReportPostgresEntity,
  UserPostgresEntity,
} from "./entities.js"
import { RefreshTokensService } from "./refreshTokens.service.js"
import { UserPostgresService } from "./user-postgres.service.js"
import { JwtService } from "@nestjs/jwt"
import { KoreaderSyncPostgresService } from "./koreader-sync-postgres.service.js"

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SyncReportPostgresEntity,
      NotificationPostgresEntity,
      NotificationDeliveryPostgresEntity,
      UserPostgresEntity,
      RefreshTokenPostgresEntity,
      KoreaderSyncCredentialPostgresEntity,
      KoreaderSyncProgressPostgresEntity,
    ]),
  ],
  providers: [
    SyncReportPostgresService,
    AppConfigService,
    NotificationPostgresService,
    RefreshTokensService,
    UserPostgresService,
    KoreaderSyncPostgresService,
    JwtService,
  ],
  exports: [
    TypeOrmModule,
    RefreshTokensService,
    SyncReportPostgresService,
    NotificationPostgresService,
    UserPostgresService,
    KoreaderSyncPostgresService,
  ],
})
export class PostgresModule {}
