import type { Request, Response } from "express"
import { AppConfigService } from "../config/AppConfigService"
import { TrustedOriginsService } from "../config/trusted-origin.service"
import {
  CouchProxyService,
  moveAuthCookieToAuthorizationHeader,
} from "./couch-proxy.service"

// Test doubles carrying only the members the proxy touches.
const createRequest = ({
  method = "OPTIONS",
  origin,
  cookies,
  headers = {},
}: {
  method?: string
  origin?: string
  cookies?: Record<string, string>
  headers?: Record<string, string>
}) =>
  ({
    method,
    cookies,
    headers: { ...headers, ...(origin ? { origin } : {}) },
  }) as unknown as Request

const createResponse = () => {
  const headers: Record<string, unknown> = {}

  return {
    headers,
    response: {
      setHeader: (name: string, value: unknown) => {
        headers[name] = value
      },
      writeHead: jest.fn(),
      end: jest.fn(),
      // Response test double, see above.
    } as unknown as Response,
  }
}

const createService = () => {
  const appConfigService = {
    COUCH_DB_URL: "http://couchdb:5984",
    APP_PUBLIC_URL: "https://oboku.example.com",
    API_CORS_TRUSTED_ORIGINS: ["https://admin.example.org"],
  }
  const trustedOriginsService = new TrustedOriginsService(
    // Config test double limited to what TrustedOriginsService reads.
    appConfigService as unknown as AppConfigService,
  )

  return new CouchProxyService(
    // Config test double limited to what the proxy reads.
    appConfigService as unknown as AppConfigService,
    trustedOriginsService,
  )
}

describe("CouchProxyService CORS", () => {
  it("reflects a trusted origin with credentials on preflight", () => {
    const service = createService()
    const { headers, response } = createResponse()

    service.middleware(
      createRequest({ origin: "https://oboku.example.com:8443" }),
      response,
    )

    expect(headers["Access-Control-Allow-Origin"]).toBe(
      "https://oboku.example.com:8443",
    )
    expect(headers["Access-Control-Allow-Credentials"]).toBe("true")
    expect(headers.Vary).toBe("Origin")
  })

  it("reflects an explicitly listed extra origin", () => {
    const service = createService()
    const { headers, response } = createResponse()

    service.middleware(
      createRequest({ origin: "https://admin.example.org" }),
      response,
    )

    expect(headers["Access-Control-Allow-Origin"]).toBe(
      "https://admin.example.org",
    )
  })

  it("gives an untrusted origin no CORS headers so the browser refuses it", () => {
    const service = createService()
    const { headers, response } = createResponse()

    service.middleware(
      createRequest({ origin: "https://evil.example.net" }),
      response,
    )

    expect(headers["Access-Control-Allow-Origin"]).toBeUndefined()
    expect(headers["Access-Control-Allow-Credentials"]).toBeUndefined()
  })

  it("keeps the wildcard for origin-less (non-browser) requests", () => {
    const service = createService()
    const { headers, response } = createResponse()

    service.middleware(createRequest({}), response)

    expect(headers["Access-Control-Allow-Origin"]).toBe("*")
    expect(headers["Access-Control-Allow-Credentials"]).toBeUndefined()
  })
})

describe("moveAuthCookieToAuthorizationHeader", () => {
  it("turns the access cookie into a Bearer header and strips cookies", () => {
    const request = createRequest({
      method: "GET",
      cookies: { oboku_access_token: "cookie-jwt" },
      headers: { cookie: "oboku_access_token=cookie-jwt" },
    })

    moveAuthCookieToAuthorizationHeader(request)

    expect(request.headers.authorization).toBe("Bearer cookie-jwt")
    expect(request.headers.cookie).toBeUndefined()
  })

  it("keeps an existing Authorization header (admin passthrough)", () => {
    const request = createRequest({
      method: "GET",
      cookies: { oboku_access_token: "cookie-jwt" },
      headers: { authorization: "Bearer admin-jwt" },
    })

    moveAuthCookieToAuthorizationHeader(request)

    expect(request.headers.authorization).toBe("Bearer admin-jwt")
  })

  it("leaves requests without cookie auth untouched", () => {
    const request = createRequest({ method: "GET" })

    moveAuthCookieToAuthorizationHeader(request)

    expect(request.headers.authorization).toBeUndefined()
  })
})
