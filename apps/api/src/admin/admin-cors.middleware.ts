import type { NextFunction, Request, Response } from "express"
import type { TrustedOriginsService } from "../config/trusted-origin.service"

const ALLOWED_METHODS = "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS"
const ALLOWED_HEADERS = "authorization, content-type"
const PREFLIGHT_MAX_AGE = "86400"

/**
 * CORS for the admin panel, which authenticates with a Bearer token instead of
 * cookies. `Access-Control-Allow-Credentials` is deliberately absent, so the
 * browser refuses to attach cookies to these routes and a compromised admin
 * host cannot act as a signed-in reader.
 *
 * Mounted ahead of the global credentialed CORS, which leaves responses
 * untouched for origins it does not trust and so preserves these headers.
 */
export const createAdminCorsMiddleware = (
  trustedOrigins: TrustedOriginsService,
) =>
  function adminCors(request: Request, response: Response, next: NextFunction) {
    const origin = request.headers.origin

    if (!origin || !trustedOrigins.isAdminOrigin(origin)) {
      return next()
    }

    response.setHeader("Access-Control-Allow-Origin", origin)
    response.setHeader("Vary", "Origin")

    if (request.method === "OPTIONS") {
      response.setHeader("Access-Control-Allow-Methods", ALLOWED_METHODS)
      response.setHeader("Access-Control-Allow-Headers", ALLOWED_HEADERS)
      response.setHeader("Access-Control-Max-Age", PREFLIGHT_MAX_AGE)
      response.writeHead(204)
      response.end()

      return
    }

    next()
  }
