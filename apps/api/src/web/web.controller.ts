import { Controller, Get } from "@nestjs/common"
import { DEFAULT_MICROSOFT_APPLICATION_AUTHORITY } from "@oboku/shared"
import { AppConfigService } from "../config/AppConfigService.js"
import { Public } from "../auth/auth.guard.js"
import { InstanceConfigService } from "../admin/instance-config/instance-config.service.js"
import { PublicServerSourceDto, WebConfigResponseDto } from "./web.dto.js"

@Controller("web")
export class WebController {
  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly instanceConfigService: InstanceConfigService,
  ) {}

  @Public()
  @Get("config")
  getConfig(): WebConfigResponseDto {
    const config = this.instanceConfigService.getConfig().value

    return {
      GOOGLE_CLIENT_ID: this.appConfigService.GOOGLE_CLIENT_ID,
      GOOGLE_API_KEY: this.appConfigService.GOOGLE_API_KEY,
      DROPBOX_CLIENT_ID: this.appConfigService.DROPBOX_CLIENT_ID,
      MICROSOFT_APPLICATION_CLIENT_ID: config.microsoftApplicationClientId,
      MICROSOFT_APPLICATION_AUTHORITY:
        config.microsoftApplicationAuthority ||
        DEFAULT_MICROSOFT_APPLICATION_AUTHORITY,
      FEATURE_SERVER_SYNC_ENABLED: config.serverSync.enabled,
      SHOW_DISABLED_PLUGINS: config.showDisabledPlugins,
    }
  }

  @Public()
  @Get("server-sources")
  listServerSources(): PublicServerSourceDto[] {
    return this.instanceConfigService.getEnabledServerSources()
  }
}
