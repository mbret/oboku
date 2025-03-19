import { Controller, Get, InternalServerErrorException } from "@nestjs/common"
import { AppConfigService } from "../config/AppConfigService"

@Controller("web")
export class WebController {
  constructor(private readonly appConfigService: AppConfigService) {}

  @Get("config")
  getConfig() {
    return {
      API_COUCH_URI: this.appConfigService.COUCH_DB_URL,
    }
  }
}
