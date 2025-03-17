import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { SyncReportPostgresEntity } from "./SyncReportPostgresEntity"
import { SyncReportPostresService } from "./SyncReportPostresService"
import { AppConfigService } from "../config/AppConfigService"

@Module({
  imports: [TypeOrmModule.forFeature([SyncReportPostgresEntity])],
  providers: [SyncReportPostresService, AppConfigService],
  exports: [TypeOrmModule],
})
export class PostgresModule {}
