import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { EnvironmentVariables } from "./types"

@Injectable()
export class AppConfigService {
  constructor(public config: ConfigService<EnvironmentVariables>) {}

  get POSTGRES_MAX_REPORTS_PER_USER(): number {
    return this.config.getOrThrow("POSTGRES_MAX_REPORTS_PER_USER", {
      infer: true,
    })
  }
}
