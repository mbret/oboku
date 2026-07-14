import type { Request, Response } from "express"
import { AppConfigService } from "../config/AppConfigService"
import { AuthCookiesService } from "./auth-cookies"

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000

const createService = (appPublicUrl = "http://localhost:3000") =>
  new AuthCookiesService(
    // Config test double limited to what the service reads.
    {
      SECURITY_REFRESH_TOKEN_TTL_MS: SIX_MONTHS_MS,
      APP_PUBLIC_URL: appPublicUrl,
    } as unknown as AppConfigService,
  )

// Request/response test doubles limited to what the service touches.
const createRequest = (headers: Record<string, string> = {}, secure = false) =>
  ({ headers, secure }) as unknown as Request

const createResponse = () => {
  const cookie = jest.fn()

  return {
    mocks: { cookie },
    response: { cookie } as unknown as Response,
  }
}

describe("AuthCookiesService", () => {
  it("sets both httpOnly Lax cookies with their scoping paths", () => {
    const service = createService()
    const { mocks, response } = createResponse()

    service.set(createRequest(), response, {
      accessToken: "access-jwt",
      refreshToken: "refresh-token",
    })

    expect(mocks.cookie).toHaveBeenCalledWith(
      "oboku_access_token",
      "access-jwt",
      {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/",
      },
    )
    expect(mocks.cookie).toHaveBeenCalledWith(
      "oboku_refresh_token",
      "refresh-token",
      {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/auth",
        maxAge: SIX_MONTHS_MS,
      },
    )
  })

  it("marks the cookies secure behind a TLS-terminating proxy", () => {
    const service = createService()
    const { mocks, response } = createResponse()

    service.set(
      createRequest({ "x-forwarded-proto": "https,http" }),
      response,
      { accessToken: "access-jwt", refreshToken: "refresh-token" },
    )

    expect(mocks.cookie).toHaveBeenCalledWith(
      "oboku_access_token",
      "access-jwt",
      expect.objectContaining({ secure: true }),
    )
  })

  it("marks the cookies secure when the public URL is https", () => {
    const service = createService("https://oboku.example")
    const { mocks, response } = createResponse()

    service.set(createRequest(), response, {
      accessToken: "access-jwt",
      refreshToken: "refresh-token",
    })

    expect(mocks.cookie).toHaveBeenCalledWith(
      "oboku_access_token",
      "access-jwt",
      expect.objectContaining({ secure: true }),
    )
    expect(mocks.cookie).toHaveBeenCalledWith(
      "oboku_refresh_token",
      "refresh-token",
      expect.objectContaining({ secure: true }),
    )
  })
})
