import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { NotificationPostgresService } from "./notification-postgres.service.js"
import { SyncReportPostgresService } from "./SyncReportPostgresService.js"
import { AppConfigService } from "../../config/AppConfigService.js"
import {
  NotificationDeliveryPostgresEntity,
  NotificationPostgresEntity,
  RefreshTokenPostgresEntity,
  SyncReportPostgresEntity,
  UserPostgresEntity,
} from "./entities.js"
import { RefreshTokensService } from "./refreshTokens.service.js"
import { UserPostgresService } from "./user-postgres.service.js"
import { JwtService } from "@nestjs/jwt"

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SyncReportPostgresEntity,
      NotificationPostgresEntity,
      NotificationDeliveryPostgresEntity,
      UserPostgresEntity,
      RefreshTokenPostgresEntity,
    ]),
  ],
  providers: [
    SyncReportPostgresService,
    AppConfigService,
    NotificationPostgresService,
    RefreshTokensService,
    UserPostgresService,
    JwtService,
  ],
  exports: [
    TypeOrmModule,
    RefreshTokensService,
    SyncReportPostgresService,
    NotificationPostgresService,
    UserPostgresService,
  ],
})
export class PostgresModule {}
