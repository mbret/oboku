import type { NextFunction, Request, Response } from "express"
import { AppConfigService } from "../config/AppConfigService"
import { TrustedOriginsService } from "../config/trusted-origin.service"
import { createAdminCorsMiddleware } from "./admin-cors.middleware"

const createMiddleware = (adminPublicUrl?: string) =>
  createAdminCorsMiddleware(
    new TrustedOriginsService(
      // Config test double limited to what TrustedOriginsService reads.
      {
        APP_PUBLIC_URL: "https://oboku.example.com",
        ADMIN_PUBLIC_URL: adminPublicUrl,
      } as unknown as AppConfigService,
    ),
  )

const createResponse = () => {
  const headers: Record<string, string> = {}

  return {
    headers,
    setHeader: jest.fn((name: string, value: string) => {
      headers[name] = value
    }),
    writeHead: jest.fn(),
    end: jest.fn(),
  }
}

const run = (
  middleware: ReturnType<typeof createAdminCorsMiddleware>,
  { method = "GET", origin }: { method?: string; origin?: string } = {},
) => {
  const response = createResponse()
  const next = jest.fn()

  middleware(
    { method, headers: { origin } } as unknown as Request,
    response as unknown as Response,
    next as unknown as NextFunction,
  )

  return { response, next }
}

describe("adminCors", () => {
  it("reflects the admin origin without allowing credentials", () => {
    const { response, next } = run(
      createMiddleware("https://admin.example.org"),
      { origin: "https://admin.example.org" },
    )

    expect(response.headers["Access-Control-Allow-Origin"]).toBe(
      "https://admin.example.org",
    )
    expect(response.headers["Access-Control-Allow-Credentials"]).toBeUndefined()
    expect(next).toHaveBeenCalled()
  })

  it("answers the preflight itself", () => {
    const { response, next } = run(
      createMiddleware("https://admin.example.org"),
      { method: "OPTIONS", origin: "https://admin.example.org" },
    )

    expect(response.writeHead).toHaveBeenCalledWith(204)
    expect(response.headers["Access-Control-Allow-Headers"]).toContain(
      "authorization",
    )
    expect(next).not.toHaveBeenCalled()
  })

  it("leaves other origins to the credentialed CORS below", () => {
    const { response, next } = run(
      createMiddleware("https://admin.example.org"),
      { method: "OPTIONS", origin: "https://evil.example.net" },
    )

    expect(response.setHeader).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })

  it("serves the stock layout without ADMIN_PUBLIC_URL", () => {
    const { response } = run(createMiddleware(), {
      origin: "https://oboku.example.com:3003",
    })

    expect(response.headers["Access-Control-Allow-Origin"]).toBe(
      "https://oboku.example.com:3003",
    )
  })

  it("ignores requests without an origin", () => {
    const { response, next } = run(
      createMiddleware("https://admin.example.org"),
      { method: "OPTIONS" },
    )

    expect(response.setHeader).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })
})
