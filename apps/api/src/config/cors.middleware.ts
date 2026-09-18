import type { NextFunction, Request, Response } from "express"
import type { TrustedOriginsService } from "./trusted-origin.service"

const ADMIN_PATH_PREFIX = "/admin"
const ALLOWED_METHODS = "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS"
const DEFAULT_ALLOWED_HEADERS = "authorization, content-type"
const PREFLIGHT_MAX_AGE = "86400"

const isAdminRequest = (request: Request) =>
  request.path === ADMIN_PATH_PREFIX ||
  request.path.startsWith(`${ADMIN_PATH_PREFIX}/`)

/**
 * The single CORS decision for the API, kept in one middleware because the two
 * policies apply to overlapping origins: in the stock layout the admin panel
 * runs on another port of the web app's hostname, so it satisfies both. Split
 * across two layers, whichever ran second would decide, and credentials would
 * leak onto `/admin` whenever the panel shared the app's hostname.
 *
 * `/admin/*` is Bearer-authenticated and never gets
 * `Access-Control-Allow-Credentials`, so the browser refuses to attach cookies
 * to it and a compromised admin host cannot act as a signed-in reader. Every
 * other route serves the cookie-carrying web app and does get credentials,
 * which is why only origins sharing its cookie jar are reflected — a
 * wildcard policy there would hand any website credentialed access.
 *
 * Mount before the body parsers: express.json()/urlencoded() reject a
 * malformed or oversized body straight to Express's error handler, bypassing
 * every middleware registered after them, and those 400/413 responses would
 * otherwise ship without `Access-Control-Allow-Origin` — which the browser
 * masks as an opaque cross-origin error rather than the real status.
 */
export const createCorsMiddleware = (trustedOrigins: TrustedOriginsService) =>
  function cors(request: Request, response: Response, next: NextFunction) {
    const origin = request.headers.origin

    response.setHeader("Vary", "Origin, Access-Control-Request-Headers")

    if (!origin) {
      return next()
    }

    const servesAdmin = isAdminRequest(request)
    const isAllowed = servesAdmin
      ? trustedOrigins.isAdminOrigin(origin)
      : trustedOrigins.isAppOrigin(origin)

    if (!isAllowed) {
      return next()
    }

    response.setHeader("Access-Control-Allow-Origin", origin)

    if (!servesAdmin) {
      response.setHeader("Access-Control-Allow-Credentials", "true")
    }

    if (request.method === "OPTIONS") {
      const requestedHeaders = request.headers["access-control-request-headers"]

      response.setHeader("Access-Control-Allow-Methods", ALLOWED_METHODS)
      response.setHeader(
        "Access-Control-Allow-Headers",
        requestedHeaders ?? DEFAULT_ALLOWED_HEADERS,
      )
      response.setHeader("Access-Control-Max-Age", PREFLIGHT_MAX_AGE)
      response.writeHead(204)
      response.end()

      return
    }

    next()
  }
