import { Injectable } from "@nestjs/common"
import { AppConfigService } from "./AppConfigService"
import { parseUrl } from "../lib/http/url"

/**
 * Decides which browser origins may make credentialed (cookie-carrying)
 * requests. Auth cookies are host-scoped and ignore ports, so every port on
 * the web app's hostname shares the same cookie jar and counts as trusted;
 * anything else (e.g. a separately-hosted admin app) must be listed explicitly
 * via `API_CORS_TRUSTED_ORIGINS`. Configured entries are compared against the
 * browser's `Origin` header, which carries no path or trailing slash, so they
 * are reduced to their origin before matching.
 */
@Injectable()
export class TrustedOriginsService {
  private readonly trustedOrigins: Set<string>
  private readonly appHostname: string | undefined

  constructor(private appConfigService: AppConfigService) {
    this.trustedOrigins = new Set(
      this.appConfigService.API_CORS_TRUSTED_ORIGINS.flatMap(
        function toOrigin(configuredOrigin) {
          const parsed = parseUrl(configuredOrigin)

          return parsed ? [parsed.origin] : []
        },
      ),
    )
    this.appHostname = parseUrl(this.appConfigService.APP_PUBLIC_URL)?.hostname
  }

  get trustedOriginsDescription(): string {
    const appHostnameRule = this.appHostname
      ? [`any port on ${this.appHostname}`]
      : []

    return [...appHostnameRule, ...this.trustedOrigins].join(", ")
  }

  isTrusted(origin: string | undefined): boolean {
    if (!origin) return false

    if (this.trustedOrigins.has(origin)) return true

    const originHostname = parseUrl(origin)?.hostname

    return !!originHostname && originHostname === this.appHostname
  }
}
