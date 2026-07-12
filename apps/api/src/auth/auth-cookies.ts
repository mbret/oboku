import { Injectable } from "@nestjs/common"
import type { CookieOptions, Request, Response } from "express"
import { AppConfigService } from "../config/AppConfigService"

export const ACCESS_TOKEN_COOKIE = "oboku_access_token"
export const REFRESH_TOKEN_COOKIE = "oboku_refresh_token"

/**
 * The token pair the auth flow hands to the browser exclusively through
 * httpOnly cookies. Kept server-internal on purpose: it never appears in a
 * response body, so JS (and therefore XSS) cannot read it.
 */
export type AuthTokens = {
  accessToken: string
  refreshToken: string
}

const ACCESS_TOKEN_COOKIE_PATH = "/"
/** Keeps the refresh token off every request except `/auth/*` (token, logout). */
const REFRESH_TOKEN_COOKIE_PATH = "/auth"

const isRequestSecure = (request: Request) => {
  const forwardedProtoHeader = request.headers["x-forwarded-proto"]
  const forwardedProto = Array.isArray(forwardedProtoHeader)
    ? forwardedProtoHeader[0]
    : forwardedProtoHeader
  const outermostProto = forwardedProto?.split(",")[0]?.trim()

  return request.secure || outermostProto === "https"
}

@Injectable()
export class AuthCookiesService {
  constructor(private appConfigService: AppConfigService) {}

  private baseOptions(request: Request): CookieOptions {
    return {
      httpOnly: true,
      sameSite: "lax",
      secure: isRequestSecure(request),
    }
  }

  set(
    request: Request,
    response: Response,
    { accessToken, refreshToken }: AuthTokens,
  ) {
    response.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      ...this.baseOptions(request),
      path: ACCESS_TOKEN_COOKIE_PATH,
    })
    response.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...this.baseOptions(request),
      path: REFRESH_TOKEN_COOKIE_PATH,
      maxAge: this.appConfigService.SECURITY_REFRESH_TOKEN_TTL_MS,
    })
  }

  clear(request: Request, response: Response) {
    response.clearCookie(ACCESS_TOKEN_COOKIE, {
      ...this.baseOptions(request),
      path: ACCESS_TOKEN_COOKIE_PATH,
    })
    response.clearCookie(REFRESH_TOKEN_COOKIE, {
      ...this.baseOptions(request),
      path: REFRESH_TOKEN_COOKIE_PATH,
    })
  }
}
