import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { EnvironmentVariables } from "./types"

@Injectable()
export class AppConfigService {
  constructor(public config: ConfigService<EnvironmentVariables>) {}

  get POSTGRES_MAX_REPORTS_PER_USER(): number {
    return 10
  }

  get COUCH_DB_URL(): string {
    return this.config.getOrThrow("COUCH_DB_URL", { infer: true })
  }
}
