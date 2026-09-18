import { Injectable } from "@nestjs/common"
import { AppConfigService } from "./AppConfigService"
import { parseUrl } from "../lib/http/url"

/**
 * Decides what a browser origin is allowed to do, which splits in two because
 * the web app and the admin panel authenticate differently.
 *
 * Cookie origins may make credentialed (cookie-carrying) requests and are
 * exempt from the CSRF origin check. Auth cookies are host-scoped and ignore
 * ports, so every port on the web app's hostname shares the same cookie jar
 * and qualifies.
 *
 * The admin origin only gets CORS on `/admin/*`, without credentials: the
 * panel authenticates with a Bearer token and never sends cookies, so granting
 * it cookie powers would widen the blast radius of an admin-host compromise
 * for nothing. It defaults to the cookie origins, which already cover the
 * stock layout of serving the panel on another port of the same hostname.
 */
@Injectable()
export class TrustedOriginsService {
  private readonly appHostname: string | undefined
  private readonly adminOrigin: string | undefined

  constructor(private appConfigService: AppConfigService) {
    this.appHostname = parseUrl(this.appConfigService.APP_PUBLIC_URL)?.hostname

    const adminPublicUrl = this.appConfigService.ADMIN_PUBLIC_URL

    this.adminOrigin = adminPublicUrl
      ? parseUrl(adminPublicUrl)?.origin
      : undefined
  }

  get originPolicyDescription(): string {
    const cookieOrigins = this.appHostname
      ? `any port on ${this.appHostname}`
      : "none"

    return `cookies: ${cookieOrigins}; admin: ${this.adminOrigin ?? "not set"}`
  }

  isCookieOrigin(origin: string | undefined): boolean {
    if (!origin) return false

    const originHostname = parseUrl(origin)?.hostname

    return !!originHostname && originHostname === this.appHostname
  }

  isAdminOrigin(origin: string | undefined): boolean {
    if (!origin) return false

    if (this.adminOrigin) return origin === this.adminOrigin

    return this.isCookieOrigin(origin)
  }
}
