import { Module } from "@nestjs/common"
import { CoversController } from "./covers.controller"
import { InMemoryTaskQueueService } from "src/features/queue/InMemoryTaskQueueService"
import { AppConfigModule } from "src/config/config.module"
import { CoversService } from "./covers.service"
import { CoversCleanupService } from "./covers-cleanup.service"
import { CouchModule } from "src/couch/couch.module"

@Module({
  providers: [InMemoryTaskQueueService, CoversService, CoversCleanupService],
  exports: [CoversService],
  imports: [AppConfigModule, CouchModule],
  controllers: [CoversController],
})
export class CoversModule {}
