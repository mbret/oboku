import { Controller, Get } from "@nestjs/common"
import { AppConfigService } from "../../config/AppConfigService"
import { Public } from "src/auth/auth.guard"
import { InstanceConfigService } from "src/config/instance/instance-config.service"

@Controller("web")
export class WebController {
  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly instanceConfigService: InstanceConfigService,
  ) {}

  @Public()
  @Get("config")
  getConfig() {
    return {
      GOOGLE_CLIENT_ID: this.appConfigService.GOOGLE_CLIENT_ID,
      GOOGLE_API_KEY: this.appConfigService.GOOGLE_API_KEY,
      DROPBOX_CLIENT_ID: this.appConfigService.DROPBOX_CLIENT_ID,
    }
  }

  @Public()
  @Get("server-sources")
  listServerSources() {
    return this.instanceConfigService.getEnabledServerSources()
  }
}
