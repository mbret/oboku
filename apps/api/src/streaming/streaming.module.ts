import { Module } from "@nestjs/common"
import { InstanceConfigModule } from "../admin/instance-config/instance-config.module.js"
import { PostgresModule } from "../features/postgres/postgres.module.js"
import { StreamingUsageService } from "./streaming-usage.service.js"

@Module({
  imports: [PostgresModule, InstanceConfigModule],
  providers: [StreamingUsageService],
  exports: [StreamingUsageService],
})
export class StreamingModule {}
