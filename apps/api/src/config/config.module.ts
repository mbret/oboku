import { Module, Global } from "@nestjs/common"
import { AppConfigService } from "./AppConfigService"
import { SecretsService } from "./SecretsService"

@Global()
@Module({
  providers: [AppConfigService, SecretsService],
  exports: [AppConfigService, SecretsService],
})
export class AppConfigModule {}
