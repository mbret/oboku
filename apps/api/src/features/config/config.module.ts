import { Module, Global } from "@nestjs/common"
import { AppConfigService } from "./AppConfigService"

@Global()
@Module({
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
