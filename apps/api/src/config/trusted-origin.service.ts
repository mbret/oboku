import { Injectable } from "@nestjs/common"
import { AppConfigService } from "./AppConfigService"
import { parseUrl } from "../lib/http/url"

/**
 * Decides which browser origins may make credentialed (cookie-carrying)
 * requests. Auth cookies are host-scoped and ignore ports, so every port on
 * the web app's hostname shares the same cookie jar and counts as trusted;
 * anything else (e.g. a separately-hosted admin app) must be listed explicitly
 * via `API_CORS_TRUSTED_ORIGINS`.
 */
@Injectable()
export class TrustedOriginsService {
  constructor(private appConfigService: AppConfigService) {}

  isTrusted(origin: string | undefined): boolean {
    if (!origin) return false

    if (this.appConfigService.API_CORS_TRUSTED_ORIGINS.includes(origin)) {
      return true
    }

    const originHostname = parseUrl(origin)?.hostname
    const appHostname = parseUrl(this.appConfigService.APP_PUBLIC_URL)?.hostname

    return !!originHostname && originHostname === appHostname
  }
}
