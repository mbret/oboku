import { Module } from "@nestjs/common"
import { DataSourcesController } from "./datasource.controller"
import { InMemoryTaskQueueService } from "src/features/queue/InMemoryTaskQueueService"
import { PostgresModule } from "src/features/postgres/postgres.module"
import { CouchModule } from "src/couch/couch.module"
import { CoversModule } from "src/covers/covers.module"
import { DataSourceService } from "./datasource.service"

@Module({
  imports: [PostgresModule, CouchModule, CoversModule],
  providers: [InMemoryTaskQueueService, DataSourceService],
  controllers: [DataSourcesController],
  exports: [],
})
export class DataSourceModule {}
