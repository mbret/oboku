import { Module, Global } from "@nestjs/common"
import { AppConfigService } from "./AppConfigService.js"
import { SecretsService } from "./SecretsService.js"
import { TrustedOriginsService } from "./trusted-origin.service.js"

@Global()
@Module({
  providers: [AppConfigService, SecretsService, TrustedOriginsService],
  exports: [AppConfigService, SecretsService, TrustedOriginsService],
})
export class AppConfigModule {}
