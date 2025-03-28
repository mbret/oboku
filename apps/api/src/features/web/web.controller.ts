import { Controller, Get } from "@nestjs/common"
import { AppConfigService } from "../../config/AppConfigService"
import { Public } from "src/auth/auth.guard"

@Controller("web")
export class WebController {
  constructor(private readonly appConfigService: AppConfigService) {}

  @Public()
  @Get("config")
  getConfig() {
    return {
      API_COUCH_URI: this.appConfigService.COUCH_DB_URL,
      GOOGLE_CLIENT_ID: this.appConfigService.GOOGLE_CLIENT_ID,
      GOOGLE_API_KEY: this.appConfigService.GOOGLE_API_KEY,
      DROPBOX_CLIENT_ID: this.appConfigService.DROPBOX_CLIENT_ID,
    }
  }
}
