import { Module } from "@nestjs/common"
import { PluginsService } from "./plugins.service.js"

@Module({
  providers: [PluginsService],
  exports: [PluginsService],
})
export class PluginsModule {}
