import { Module } from "@nestjs/common"
import { InstanceConfigService } from "./instance-config.service.js"
import { ServerSourcesService } from "./server-sources.service.js"

@Module({
  providers: [InstanceConfigService, ServerSourcesService],
  exports: [InstanceConfigService],
})
export class InstanceConfigModule {}
