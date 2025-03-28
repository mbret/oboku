import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { SyncReportPostgresService } from "./SyncReportPostgresService"
import { AppConfigService } from "../../config/AppConfigService"
import {
  CommunicationPostgresEntity,
  SyncReportPostgresEntity,
  UserPostgresEntity,
} from "./entities"
import { CommunicationPostgresService } from "./CommunicationPostgresService"

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SyncReportPostgresEntity,
      CommunicationPostgresEntity,
      UserPostgresEntity,
    ]),
  ],
  providers: [
    SyncReportPostgresService,
    AppConfigService,
    CommunicationPostgresService,
  ],
  exports: [TypeOrmModule],
})
export class PostgresModule {}
