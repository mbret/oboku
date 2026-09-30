import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { NotificationPostgresService } from "./notification-postgres.service"
import { SyncReportPostgresService } from "./SyncReportPostgresService"
import { AppConfigService } from "../../config/AppConfigService"
import {
  KoreaderSyncCredentialPostgresEntity,
  KoreaderSyncProgressPostgresEntity,
  NotificationDeliveryPostgresEntity,
  NotificationPostgresEntity,
  RefreshTokenPostgresEntity,
  SyncReportPostgresEntity,
  UserPostgresEntity,
} from "./entities"
import { RefreshTokensService } from "./refreshTokens.service"
import { UserPostgresService } from "./user-postgres.service"
import { JwtService } from "@nestjs/jwt"
import { KoreaderSyncPostgresService } from "./koreader-sync-postgres.service"

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
