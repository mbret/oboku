import { Module, Global } from "@nestjs/common"
import { AppConfigService } from "./AppConfigService"
import { SecretsService } from "./SecretsService"
import { InstanceConfigService } from "./instance/instance-config.service"
import { ServerSourcesService } from "src/config/instance/server-sources.service"

@Global()
@Module({
  providers: [
    AppConfigService,
    SecretsService,
    InstanceConfigService,
    ServerSourcesService,
  ],
  exports: [
    AppConfigService,
    SecretsService,
    InstanceConfigService,
    ServerSourcesService,
  ],
})
export class AppConfigModule {}
