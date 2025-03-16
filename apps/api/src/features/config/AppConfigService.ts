import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { EnvironmentVariables } from "../../types"

@Injectable()
export class AppConfigService {
  constructor(public config: ConfigService<EnvironmentVariables>) {}
}
