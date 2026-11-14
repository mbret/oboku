import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { NotificationPostgresService } from "./notification-postgres.service.js"
import { SyncReportPostgresService } from "./SyncReportPostgresService.js"
import { AppConfigService } from "../../config/AppConfigService.js"
import {
  ProxiedDownloadUsagePostgresEntity,
  KoreaderSyncConnectionPostgresEntity,
  KoreaderSyncCredentialPostgresEntity,
  KoreaderSyncProgressPostgresEntity,
  NotificationDeliveryPostgresEntity,
  NotificationPostgresEntity,
  OpdsServerPostgresEntity,
  ProviderConnectionPostgresEntity,
  RefreshTokenPostgresEntity,
  SyncReportPostgresEntity,
  UserPostgresEntity,
} from "./entities.js"
import { RefreshTokensService } from "./refreshTokens.service.js"
import { UserPostgresService } from "./user-postgres.service.js"
import { JwtService } from "@nestjs/jwt"
import { KoreaderSyncPostgresService } from "./koreader-sync-postgres.service.js"
import { KoreaderSyncConnectionPostgresService } from "./koreader-sync-connection-postgres.service.js"
import { OpdsServerPostgresService } from "./opds-server-postgres.service.js"
import { ProviderConnectionPostgresService } from "./provider-connection-postgres.service.js"
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
      ProviderConnectionPostgresEntity,
      ProxiedDownloadUsagePostgresEntity,
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
    ProviderConnectionPostgresService,
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
    ProviderConnectionPostgresService,
    ProxiedDownloadUsagePostgresService,
  ],
})
export class PostgresModule {}
