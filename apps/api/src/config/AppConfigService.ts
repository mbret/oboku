import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { EnvironmentVariables } from "./types"
import * as path from "node:path"

@Injectable()
export class AppConfigService {
  constructor(public config: ConfigService<EnvironmentVariables>) {}

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

  get GOOGLE_API_KEY() {
    return this.config.get("GOOGLE_API_KEY", { infer: true })
  }

  get DROPBOX_CLIENT_ID() {
    return this.config.get("DROPBOX_CLIENT_ID", { infer: true })
  }

  get COMICVINE_API_KEY() {
    return this.config.get("COMICVINE_API_KEY", { infer: true })
  }

  get JWT_PRIVATE_KEY_FILE() {
    return this.config.getOrThrow("JWT_PRIVATE_KEY_FILE", { infer: true })
  }

  get JWT_PUBLIC_KEY_FILE() {
    return this.config.getOrThrow("JWT_PUBLIC_KEY_FILE", { infer: true })
  }

  get DATA_DIR() {
    return this.config.getOrThrow("API_DATA_DIR", { infer: true })
  }

  get COVERS_BUCKET_NAME() {
    return this.config.get("COVERS_BUCKET_NAME", { infer: true })
  }

  get AWS_ACCESS_KEY_ID() {
    return this.config.get("AWS_ACCESS_KEY_ID", { infer: true })
  }

  get AWS_SECRET_ACCESS_KEY() {
    return this.config.get("AWS_SECRET_ACCESS_KEY", { infer: true })
  }

  get ASSETS_DIR() {
    return path.join(__dirname, "..", "assets")
  }
}
