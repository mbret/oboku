import type { NextFunction, Request, Response } from "express"
import { AppConfigService } from "../config/AppConfigService"
import { TrustedOriginsService } from "../config/trusted-origin.service"
import { createCsrfOriginMiddleware } from "./csrf-origin.middleware"

const trustedOrigins = new TrustedOriginsService(
  // Config test double limited to what TrustedOriginsService reads.
  {
    APP_PUBLIC_URL: "https://oboku.example.com",
    API_CORS_TRUSTED_ORIGINS: [],
  } as unknown as AppConfigService,
)

const runMiddleware = ({
  method,
  origin,
  cookies,
}: {
  method: string
  origin?: string
  cookies?: Record<string, string>
}) => {
  const middleware = createCsrfOriginMiddleware(trustedOrigins)
  const statusJson = jest.fn()
  const status = jest.fn().mockReturnValue({ json: statusJson })
  const next = jest.fn()

  middleware(
    // Request/response test doubles limited to what the middleware reads.
    {
      method,
      cookies,
      headers: origin ? { origin } : {},
    } as unknown as Request,
    { status } as unknown as Response,
    next as NextFunction,
  )

  return { next, status }
}

describe("csrfOriginCheck", () => {
  it("lets safe methods through untouched", () => {
    const { next, status } = runMiddleware({
      method: "GET",
      origin: "https://evil.example.net",
      cookies: { oboku_access_token: "jwt" },
    })

    expect(next).toHaveBeenCalled()
    expect(status).not.toHaveBeenCalled()
  })

  it("lets cookie-less mutations through (admin header auth, anonymous)", () => {
    const { next } = runMiddleware({
      method: "POST",
      origin: "https://evil.example.net",
    })

    expect(next).toHaveBeenCalled()
  })

  it("refuses a cookie-authenticated mutation from an untrusted origin", () => {
    const { next, status } = runMiddleware({
      method: "POST",
      origin: "https://evil.example.net",
      cookies: { oboku_access_token: "jwt" },
    })

    expect(status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it("also protects requests carrying only the refresh cookie", () => {
    const { status } = runMiddleware({
      method: "POST",
      origin: "https://evil.example.net",
      cookies: { oboku_refresh_token: "refresh" },
    })

    expect(status).toHaveBeenCalledWith(403)
  })

  it("accepts a cookie-authenticated mutation from the web origin", () => {
    const { next } = runMiddleware({
      method: "POST",
      origin: "http://oboku.example.com:5173",
      cookies: { oboku_access_token: "jwt" },
    })

    expect(next).toHaveBeenCalled()
  })

  it("accepts origin-less mutations (same-origin, non-browser clients)", () => {
    const { next } = runMiddleware({
      method: "POST",
      cookies: { oboku_access_token: "jwt" },
    })

    expect(next).toHaveBeenCalled()
  })
})
