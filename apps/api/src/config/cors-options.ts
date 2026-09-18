import type { Request } from "express"
import type { TrustedOriginsService } from "./trusted-origin.service"

const ADMIN_PATH_PREFIX = "/admin"

// Express routes case-insensitively by default, so `/Admin/settings` reaches
// the admin controller and has to be classified the same way here.
const isAdminRequest = (request: Request) => {
  const path = request.path.toLowerCase()

  return path === ADMIN_PATH_PREFIX || path.startsWith(`${ADMIN_PATH_PREFIX}/`)
}

/**
 * Structural shape of the `cors` package's options callback. `@nestjs/common`
 * declares it but does not export it from its public barrel, and deep-importing
 * its internals to name a two-field object is the worse trade.
 */
type CorsOptionsCallback = (
  error: Error | null,
  options: { origin: boolean; credentials: boolean },
) => void

/**
 * Resolves the CORS policy per request, because the two policies apply to
 * overlapping origins: in the stock layout the admin panel runs on another
 * port of the web app's hostname, so it satisfies both. Deciding once per
 * request keeps `/admin` from inheriting the credentialed policy, which a
 * second layer would otherwise reapply.
 *
 * `/admin/*` is Bearer-authenticated and never gets
 * `Access-Control-Allow-Credentials`, so the browser refuses to attach cookies
 * to it and a compromised admin host cannot act as a signed-in reader. Every
 * other route serves the cookie-carrying web app and does get credentials,
 * which is why only origins sharing its cookie jar are reflected — a wildcard
 * policy there would hand any website credentialed access.
 */
export const createCorsOptionsDelegate = (
  trustedOrigins: TrustedOriginsService,
) =>
  function resolveCorsOptions(request: Request, callback: CorsOptionsCallback) {
    const origin = request.headers.origin

    if (isAdminRequest(request)) {
      return callback(null, {
        origin: trustedOrigins.isAdminOrigin(origin),
        credentials: false,
      })
    }

    callback(null, {
      origin: trustedOrigins.isAppOrigin(origin),
      credentials: true,
    })
  }
