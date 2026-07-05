import { Module, Global } from "@nestjs/common"
import { AppConfigService } from "./AppConfigService"
import { SecretsService } from "./SecretsService"
import { TrustedOriginsService } from "./TrustedOriginsService"

@Global()
@Module({
  providers: [AppConfigService, SecretsService, TrustedOriginsService],
  exports: [AppConfigService, SecretsService, TrustedOriginsService],
})
export class AppConfigModule {}
