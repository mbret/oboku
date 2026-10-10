import { Module } from "@nestjs/common"
import { DataSourcesController } from "./datasource.controller.js"
import { PostgresModule } from "../features/postgres/postgres.module.js"
import { CouchModule } from "../couch/couch.module.js"
import { CoversModule } from "../covers/covers.module.js"
import { DataSourceService } from "./datasource.service.js"
import { NotificationsModule } from "../notifications/notifications.module.js"

@Module({
  imports: [PostgresModule, CouchModule, CoversModule, NotificationsModule],
  providers: [DataSourceService],
  controllers: [DataSourcesController],
  exports: [],
})
export class DataSourceModule {}
