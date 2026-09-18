import express from "express"
import http from "node:http"
import { AppConfigService } from "./AppConfigService"
import { createCorsMiddleware } from "./cors.middleware"
import { TrustedOriginsService } from "./trusted-origin.service"

const APP_PUBLIC_URL = "https://oboku.example.com"

const createServer = (adminPublicUrl?: string) => {
  const trustedOrigins = new TrustedOriginsService(
    // Config test double limited to what TrustedOriginsService reads.
    {
      APP_PUBLIC_URL,
      ADMIN_PUBLIC_URL: adminPublicUrl,
    } as unknown as AppConfigService,
  )
  const app = express()

  app.use(createCorsMiddleware(trustedOrigins))
  app.get("/admin/settings", (_request, response) => {
    response.json({ ok: true })
  })
  app.get("/books", (_request, response) => {
    response.json({ ok: true })
  })

  return app.listen(0)
}

const request = (
  server: http.Server,
  {
    path = "/admin/settings",
    method = "GET",
    origin,
    requestHeaders,
  }: {
    path?: string
    method?: string
    origin?: string
    requestHeaders?: string
  },
) =>
  new Promise<{ status: number; headers: http.IncomingHttpHeaders }>(
    (resolve) => {
      const { port } = server.address() as { port: number }
      const headers: Record<string, string> = {}

      if (origin) headers.Origin = origin
      if (requestHeaders)
        headers["Access-Control-Request-Headers"] = requestHeaders

      http
        .request({ port, path, method, headers }, (response) => {
          response.resume()
          response.on("end", () =>
            resolve({
              status: response.statusCode ?? 0,
              headers: response.headers,
            }),
          )
        })
        .end()
    },
  )

describe("cors", () => {
  describe("stock layout: the admin shares the web app's hostname", () => {
    let server: http.Server

    beforeAll(() => {
      server = createServer()
    })
    afterAll(() => {
      server.close()
    })

    it("never grants credentials on /admin, even though the origin is also an app origin", async () => {
      const { headers } = await request(server, {
        origin: `${APP_PUBLIC_URL}:3003`,
      })

      expect(headers["access-control-allow-origin"]).toBe(
        `${APP_PUBLIC_URL}:3003`,
      )
      expect(headers["access-control-allow-credentials"]).toBeUndefined()
    })

    it("still grants credentials on every other route", async () => {
      const { headers } = await request(server, {
        path: "/books",
        origin: `${APP_PUBLIC_URL}:3003`,
      })

      expect(headers["access-control-allow-credentials"]).toBe("true")
    })
  })

  describe("the admin on its own hostname", () => {
    let server: http.Server

    beforeAll(() => {
      server = createServer("https://admin.example.org")
    })
    afterAll(() => {
      server.close()
    })

    it("answers the admin preflight without credentials", async () => {
      const { status, headers } = await request(server, {
        method: "OPTIONS",
        origin: "https://admin.example.org",
        requestHeaders: "authorization",
      })

      expect(status).toBe(204)
      expect(headers["access-control-allow-origin"]).toBe(
        "https://admin.example.org",
      )
      expect(headers["access-control-allow-credentials"]).toBeUndefined()
      expect(headers["access-control-allow-headers"]).toBe("authorization")
    })

    it("reflects the web app with credentials", async () => {
      const { status, headers } = await request(server, {
        path: "/books",
        method: "OPTIONS",
        origin: APP_PUBLIC_URL,
      })

      expect(status).toBe(204)
      expect(headers["access-control-allow-origin"]).toBe(APP_PUBLIC_URL)
      expect(headers["access-control-allow-credentials"]).toBe("true")
    })

    it("refuses the app origin on /admin once the admin has its own", async () => {
      const { headers } = await request(server, {
        origin: `${APP_PUBLIC_URL}:3003`,
      })

      expect(headers["access-control-allow-origin"]).toBeUndefined()
    })

    it("refuses the admin origin on the cookie routes", async () => {
      const { headers } = await request(server, {
        path: "/books",
        origin: "https://admin.example.org",
      })

      expect(headers["access-control-allow-origin"]).toBeUndefined()
    })

    it("gives an untrusted origin no CORS headers", async () => {
      const { headers } = await request(server, {
        origin: "https://evil.example.net",
      })

      expect(headers["access-control-allow-origin"]).toBeUndefined()
      expect(headers.vary).toContain("Origin")
    })

    it("leaves same-origin requests alone", async () => {
      const { status, headers } = await request(server, { path: "/books" })

      expect(status).toBe(200)
      expect(headers["access-control-allow-origin"]).toBeUndefined()
    })
  })
})
