import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { EnvironmentVariables } from "./types"
import { getParametersValue } from "src/lib/ssm"

@Injectable()
export class AppConfigService {
  private jwtPrivateKey?: string
  private xAccessSecret?: string

  constructor(public config: ConfigService<EnvironmentVariables>) {
    if (config.get("AWS_ACCESS_KEY_ID")) {
      getParametersValue({
        Names: ["jwt-private-key", "x-access-secret"],
        WithDecryption: true,
      }).then(([jwtPrivateKey, xAccessSecret]) => {
        this.jwtPrivateKey = jwtPrivateKey
        this.xAccessSecret = xAccessSecret
      })
    }
  }

  get POSTGRES_MAX_REPORTS_PER_USER(): number {
    return 10
  }

  get COUCH_DB_URL(): string {
    return this.config.getOrThrow("COUCH_DB_URL", { infer: true })
  }

  get GOOGLE_CLIENT_ID(): string | undefined {
    return this.config.get("GOOGLE_CLIENT_ID", { infer: true })
  }

  get GOOGLE_CLIENT_SECRET(): string | undefined {
    return "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"
  }

  get GOOGLE_CALLBACK_URL(): string | undefined {
    return "http://localhost:3000/auth/google/callback"
  }

  get JWT_PRIVATE_KEY(): string {
    if (!this.jwtPrivateKey) {
      throw new Error("JWT_PRIVATE_KEY is not set")
    }

    return this.jwtPrivateKey
  }

  get X_ACCESS_SECRET(): string | undefined {
    return this.xAccessSecret
  }

  get GOOGLE_API_KEY() {
    return this.config.get("GOOGLE_API_KEY", { infer: true })
  }
}
