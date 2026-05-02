import { Module } from "@nestjs/common"
import { DataSourcesController } from "./datasource.controller"
import { PostgresModule } from "src/features/postgres/postgres.module"
import { CouchModule } from "src/couch/couch.module"
import { CoversModule } from "src/covers/covers.module"
import { DataSourceService } from "./datasource.service"
import { NotificationsModule } from "src/notifications/notifications.module"

@Module({
  imports: [PostgresModule, CouchModule, CoversModule, NotificationsModule],
  providers: [DataSourceService],
  controllers: [DataSourcesController],
  exports: [],
})
export class DataSourceModule {}
