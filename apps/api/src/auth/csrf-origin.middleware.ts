import type { NextFunction, Request, Response } from "express"
import type { TrustedOriginsService } from "../config/trusted-origin.service"
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "./auth-cookies"

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])

/**
 * Defense-in-depth against CSRF, on top of the primary `SameSite=Lax`
 * protection: a mutating request that carries an auth cookie and a cross-site
 * `Origin` header is refused. Requests without auth cookies (the admin app's
 * header auth, unauthenticated traffic) and requests without an Origin
 * (same-origin navigations, non-browser clients) pass through.
 */
export const createCsrfOriginMiddleware = (
  trustedOrigins: TrustedOriginsService,
) =>
  function csrfOriginCheck(
    request: Request,
    response: Response,
    next: NextFunction,
  ) {
    if (SAFE_METHODS.has(request.method)) {
      return next()
    }

    const carriesAuthCookie = Boolean(
      request.cookies?.[ACCESS_TOKEN_COOKIE] ||
        request.cookies?.[REFRESH_TOKEN_COOKIE],
    )

    if (!carriesAuthCookie) {
      return next()
    }

    const origin = request.headers.origin

    if (origin && !trustedOrigins.isTrusted(origin)) {
      response.status(403).json({ message: "Origin not allowed" })

      return
    }

    next()
  }
