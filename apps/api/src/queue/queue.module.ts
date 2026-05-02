import { Global, Module } from "@nestjs/common"
import { InMemoryTaskQueueService } from "./in-memory-task-queue.service"

@Global()
@Module({
  providers: [InMemoryTaskQueueService],
  exports: [InMemoryTaskQueueService],
})
export class QueueModule {}
