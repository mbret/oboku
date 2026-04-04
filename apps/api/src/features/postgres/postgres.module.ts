import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { NotificationPostgresService } from "./notification-postgres.service"
import { SyncReportPostgresService } from "./SyncReportPostgresService"
import { AppConfigService } from "../../config/AppConfigService"
import {
  NotificationDeliveryPostgresEntity,
  NotificationPostgresEntity,
  RefreshTokenPostgresEntity,
  SyncReportPostgresEntity,
  UserPostgresEntity,
} from "./entities"
import { RefreshTokensService } from "./refreshTokens.service"
import { UserPostgresService } from "./user-postgres.service"
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
