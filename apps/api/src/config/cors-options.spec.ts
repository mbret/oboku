import type { Request } from "express"
import { AppConfigService } from "./AppConfigService"
import { createCorsOptionsDelegate } from "./cors-options"
import { TrustedOriginsService } from "./trusted-origin.service"

const APP_PUBLIC_URL = "https://oboku.example.com"
const ADMIN_PORT_ORIGIN = `${APP_PUBLIC_URL}:3003`

const resolve = (
  { path, origin }: { path: string; origin?: string },
  adminPublicUrl?: string,
) => {
  const delegate = createCorsOptionsDelegate(
    new TrustedOriginsService(
      // Config test double limited to what TrustedOriginsService reads.
      {
        APP_PUBLIC_URL,
        ADMIN_PUBLIC_URL: adminPublicUrl,
      } as unknown as AppConfigService,
    ),
  )
  const request = { path, headers: { origin } }
  let resolved: { origin: boolean; credentials: boolean } | undefined

  delegate(
    // Request test double limited to the path and origin the delegate reads.
    request as unknown as Request,
    function captureOptions(_error, options) {
      resolved = options
    },
  )

  return resolved
}

describe("resolveCorsOptions", () => {
  describe("stock layout: the admin shares the web app's hostname", () => {
    it("never credentials /admin, though the origin is also an app origin", () => {
      expect(
        resolve({ path: "/admin/settings", origin: ADMIN_PORT_ORIGIN }),
      ).toEqual({ origin: true, credentials: false })
    })

    it("credentials every other route for that same origin", () => {
      expect(resolve({ path: "/books", origin: ADMIN_PORT_ORIGIN })).toEqual({
        origin: true,
        credentials: true,
      })
    })

    it("classifies /admin regardless of casing, as express routes it", () => {
      expect(
        resolve({ path: "/Admin/settings", origin: ADMIN_PORT_ORIGIN }),
      ).toEqual({ origin: true, credentials: false })
    })

    it("does not mistake a route merely prefixed with admin", () => {
      expect(
        resolve({ path: "/administration", origin: APP_PUBLIC_URL }),
      ).toEqual({ origin: true, credentials: true })
    })
  })

  describe("the admin on its own hostname", () => {
    const adminPublicUrl = "https://admin.example.org"

    it("allows the admin origin on /admin without credentials", () => {
      expect(
        resolve(
          { path: "/admin/settings", origin: adminPublicUrl },
          adminPublicUrl,
        ),
      ).toEqual({ origin: true, credentials: false })
    })

    it("refuses the admin origin on the cookie routes", () => {
      expect(
        resolve({ path: "/books", origin: adminPublicUrl }, adminPublicUrl),
      ).toEqual({ origin: false, credentials: true })
    })

    it("refuses the app origin on /admin once the admin has its own", () => {
      expect(
        resolve(
          { path: "/admin/settings", origin: ADMIN_PORT_ORIGIN },
          adminPublicUrl,
        ),
      ).toEqual({ origin: false, credentials: false })
    })

    it("allows the web app on the cookie routes", () => {
      expect(
        resolve({ path: "/books", origin: APP_PUBLIC_URL }, adminPublicUrl),
      ).toEqual({ origin: true, credentials: true })
    })

    it("refuses an untrusted origin everywhere", () => {
      const untrusted = "https://evil.example.net"

      expect(
        resolve({ path: "/books", origin: untrusted }, adminPublicUrl),
      ).toEqual({ origin: false, credentials: true })
      expect(
        resolve({ path: "/admin/settings", origin: untrusted }, adminPublicUrl),
      ).toEqual({ origin: false, credentials: false })
    })

    it("refuses a request carrying no origin", () => {
      expect(resolve({ path: "/books" }, adminPublicUrl)).toEqual({
        origin: false,
        credentials: true,
      })
    })
  })
})
