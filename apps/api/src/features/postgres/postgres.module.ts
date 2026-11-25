import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { NotificationPostgresService } from "./notification-postgres.service.js"
import { SyncReportPostgresService } from "./SyncReportPostgresService.js"
import { AppConfigService } from "../../config/AppConfigService.js"
import {
  KoreaderSyncConnectionPostgresEntity,
  KoreaderSyncCredentialPostgresEntity,
  KoreaderSyncProgressPostgresEntity,
  NotificationDeliveryPostgresEntity,
  NotificationPostgresEntity,
  OpdsServerPostgresEntity,
  SourceConnectionPostgresEntity,
  RefreshTokenPostgresEntity,
  SyncReportPostgresEntity,
  UserPostgresEntity,
  UserProxiedDownloadUsagePostgresEntity,
} from "./entities.js"
import { RefreshTokensService } from "./refreshTokens.service.js"
import { UserPostgresService } from "./user-postgres.service.js"
import { JwtService } from "@nestjs/jwt"
import { KoreaderSyncPostgresService } from "./koreader-sync-postgres.service.js"
import { KoreaderSyncConnectionPostgresService } from "./koreader-sync-connection-postgres.service.js"
import { OpdsServerPostgresService } from "./opds-server-postgres.service.js"
import { SourceConnectionPostgresService } from "./source-connection-postgres.service.js"
import { ProxiedDownloadUsagePostgresService } from "./proxied-download-usage-postgres.service.js"

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
      KoreaderSyncConnectionPostgresEntity,
      OpdsServerPostgresEntity,
      SourceConnectionPostgresEntity,
      UserProxiedDownloadUsagePostgresEntity,
    ]),
  ],
  providers: [
    SyncReportPostgresService,
    AppConfigService,
    NotificationPostgresService,
    RefreshTokensService,
    UserPostgresService,
    KoreaderSyncPostgresService,
    KoreaderSyncConnectionPostgresService,
    OpdsServerPostgresService,
    SourceConnectionPostgresService,
    ProxiedDownloadUsagePostgresService,
    JwtService,
  ],
  exports: [
    TypeOrmModule,
    RefreshTokensService,
    SyncReportPostgresService,
    NotificationPostgresService,
    UserPostgresService,
    KoreaderSyncPostgresService,
    KoreaderSyncConnectionPostgresService,
    OpdsServerPostgresService,
    SourceConnectionPostgresService,
    ProxiedDownloadUsagePostgresService,
  ],
})
export class PostgresModule {}
