import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { EnvironmentVariables } from "./types"
import path from "node:path"

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
    return this.config.get("JWT_PRIVATE_KEY_FILE", { infer: true })
  }

  get JWT_PRIVATE_KEY() {
    return this.config.get("JWT_PRIVATE_KEY", { infer: true })
  }

  get JWT_PUBLIC_KEY_FILE() {
    return this.config.get("JWT_PUBLIC_KEY_FILE", { infer: true })
  }

  get JWT_PUBLIC_KEY() {
    return this.config.get("JWT_PUBLIC_KEY", { infer: true })
  }

  get METADATA_EXTRACTOR_SUPPORTED_EXTENSIONS() {
    return [
      "application/x-cbz",
      "application/x-cbr",
      "application/epub+zip",
      "application/zip",
      "application/x-zip-compressed",
      "application/x-rar",
    ]
  }

  get TMP_DIR() {
    return "/tmp/oboku"
  }

  get TMP_DIR_BOOKS() {
    return path.join(this.TMP_DIR, "books")
  }

  get DATA_DIR() {
    return this.config.getOrThrow("API_DATA_DIR", { infer: true })
  }

  get CONFIG_DIR() {
    return this.config.getOrThrow("API_CONFIG_DIR", { infer: true })
  }

  get CONFIG_FILE() {
    return path.join(this.CONFIG_DIR, "config.json")
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

  /**
   * ------------------------------------------------------------
   * COVERS
   * ------------------------------------------------------------
   */

  get COVERS_BUCKET_NAME() {
    return this.config.get("COVERS_BUCKET_NAME", { infer: true })
  }

  get COVERS_DIR() {
    return path.join(this.DATA_DIR, "covers")
  }

  get COVERS_MAXIMUM_SIZE_FOR_STORAGE() {
    return { width: 400, height: 600 }
  }

  get COVERS_CLEANUP_GRACE_PERIOD_MS() {
    // Keep dangling covers for 2 days before deleting them.
    return 2 * 24 * 60 * 60 * 1000
  }

  get COVERS_STORAGE_STRATEGY() {
    return this.config.getOrThrow("COVERS_STORAGE_STRATEGY", { infer: true })
  }

  get ADMIN_LOGIN() {
    return this.config.get("ADMIN_LOGIN", { infer: true })
  }

  get ADMIN_PASSWORD() {
    return this.config.get("ADMIN_PASSWORD", { infer: true })
  }

  get NODE_ENV() {
    return this.config.getOrThrow("NODE_ENV", { infer: true })
  }

  get APP_PUBLIC_URL() {
    return this.config.getOrThrow("APP_PUBLIC_URL", { infer: true })
  }

  get EMAIL_SMTP_HOST() {
    return this.config.get("EMAIL_SMTP_HOST", { infer: true })
  }

  get EMAIL_SMTP_PORT() {
    return this.config.get("EMAIL_SMTP_PORT", { infer: true }) ?? 587
  }

  get EMAIL_SMTP_USER() {
    return this.config.get("EMAIL_SMTP_USER", { infer: true })
  }

  get EMAIL_SMTP_PASSWORD() {
    return this.config.get("EMAIL_SMTP_PASSWORD", { infer: true })
  }

  get EMAIL_FROM() {
    return this.config.get("EMAIL_FROM", { infer: true })
  }

  get EMAIL_FROM_NAME() {
    return this.config.get("EMAIL_FROM_NAME", { infer: true }) ?? "oboku"
  }

  get EMAIL_SMTP_MAX_SEND_RATE() {
    return this.config.get("EMAIL_SMTP_MAX_SEND_RATE", { infer: true })
  }

  /**
   * ------------------------------------------------------------
   * SECURITY
   * ------------------------------------------------------------
   */

  /**
   * Absolute lifetime of a single refresh-token string. Each successful refresh
   * rotates the token and resets this clock, so an active session can slide
   * indefinitely while no individual token outlives ~6 months.
   */
  get SECURITY_REFRESH_TOKEN_TTL_MS() {
    return 6 * 30 * 24 * 60 * 60 * 1000
  }

  /**
   * How long the immediately-previous refresh token stays accepted after a
   * rotation. Within this window a superseded token resolves to its successor
   * (idempotent recovery); past it that one stale token is refused — but the
   * active token in the chain keeps working, so a replay never logs the client
   * out as collateral.
   *
   * Sized to absorb erratic-client and flaky-network replays: lost rotation
   * responses, concurrent refreshes from multiple tabs, and short offline /
   * backgrounded periods. The session access token lives ~5 minutes, so one
   * hour spans ~12 natural refresh cycles — ample slack for a client to recover
   * the successor on a later request without re-authenticating.
   *
   * Keep it modest (hours, not days): since a replay no longer revokes the
   * chain, this window is also the span over which a stolen-but-stale token
   * could still be advanced onto the live chain.
   */
  get SECURITY_REFRESH_TOKEN_ROTATION_GRACE_MS() {
    return 60 * 60 * 1000
  }
}
