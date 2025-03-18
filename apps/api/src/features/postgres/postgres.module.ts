import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { SyncReportPostgresService } from "./SyncReportPostgresService"
import { AppConfigService } from "../config/AppConfigService"
import {
  CommunicationPostgresEntity,
  SyncReportPostgresEntity,
} from "./entities"
import { CommunicationPostgresService } from "./CommunicationPostgresService"

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SyncReportPostgresEntity,
      CommunicationPostgresEntity,
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
