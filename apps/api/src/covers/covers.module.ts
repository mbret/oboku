import { Module } from "@nestjs/common"
import { CoversController } from "./covers.controller"
import { InMemoryTaskQueueService } from "src/features/queue/InMemoryTaskQueueService"
import { AppConfigModule } from "src/config/config.module"
import { CoversService } from "./covers.service"

@Module({
  providers: [InMemoryTaskQueueService, CoversService],
  exports: [],
  imports: [AppConfigModule],
  controllers: [CoversController],
})
export class CoversModule {}
