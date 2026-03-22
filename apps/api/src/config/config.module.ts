import { Module, Global } from "@nestjs/common"
import { AppConfigService } from "./AppConfigService"
import { SecretsService } from "./SecretsService"
import { InstanceConfigService } from "./InstanceConfigService"

@Global()
@Module({
  providers: [AppConfigService, SecretsService, InstanceConfigService],
  exports: [AppConfigService, SecretsService, InstanceConfigService],
})
export class AppConfigModule {}
