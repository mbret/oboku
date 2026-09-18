import { AppConfigService } from "./AppConfigService"
import { TrustedOriginsService } from "./trusted-origin.service"

const createService = ({
  appPublicUrl = "https://oboku.example.com",
  adminPublicUrl,
}: {
  appPublicUrl?: string
  adminPublicUrl?: string
} = {}) =>
  new TrustedOriginsService(
    // Config test double limited to what the service reads.
    {
      APP_PUBLIC_URL: appPublicUrl,
      ADMIN_PUBLIC_URL: adminPublicUrl,
    } as unknown as AppConfigService,
  )

describe("TrustedOriginsService", () => {
  describe("isCookieOrigin", () => {
    it("trusts any port and scheme on the web app hostname (shared cookie jar)", () => {
      const service = createService()

      expect(service.isCookieOrigin("https://oboku.example.com")).toBe(true)
      expect(service.isCookieOrigin("https://oboku.example.com:8443")).toBe(
        true,
      )
      expect(service.isCookieOrigin("http://oboku.example.com:5173")).toBe(true)
    })

    it("rejects other hostnames, including subdomains", () => {
      const service = createService()

      expect(service.isCookieOrigin("https://evil.example.net")).toBe(false)
      expect(service.isCookieOrigin("https://sub.oboku.example.com")).toBe(
        false,
      )
    })

    it("never trusts the admin origin with cookies", () => {
      const service = createService({
        adminPublicUrl: "https://admin.example.org",
      })

      expect(service.isCookieOrigin("https://admin.example.org")).toBe(false)
    })

    it("rejects missing or malformed origins", () => {
      const service = createService()

      expect(service.isCookieOrigin(undefined)).toBe(false)
      expect(service.isCookieOrigin("null")).toBe(false)
      expect(service.isCookieOrigin("not a url")).toBe(false)
    })
  })

  describe("isAdminOrigin", () => {
    it("falls back to the cookie origins when unconfigured", () => {
      const service = createService()

      expect(service.isAdminOrigin("https://oboku.example.com:3003")).toBe(true)
      expect(service.isAdminOrigin("https://admin.example.org")).toBe(false)
    })

    it("matches the configured admin origin exactly", () => {
      const service = createService({
        adminPublicUrl: "https://admin.example.org",
      })

      expect(service.isAdminOrigin("https://admin.example.org")).toBe(true)
      expect(service.isAdminOrigin("https://admin.example.org:444")).toBe(false)
      expect(service.isAdminOrigin("https://evil.example.net")).toBe(false)
    })

    it("ignores a trailing slash or path on the configured URL", () => {
      const service = createService({
        adminPublicUrl: "https://admin.example.org/",
      })

      expect(service.isAdminOrigin("https://admin.example.org")).toBe(true)
    })

    it("replaces the cookie-origin fallback once configured", () => {
      const service = createService({
        adminPublicUrl: "https://admin.example.org",
      })

      expect(service.isAdminOrigin("https://oboku.example.com:3003")).toBe(
        false,
      )
    })

    it("rejects missing origins", () => {
      const service = createService({
        adminPublicUrl: "https://admin.example.org",
      })

      expect(service.isAdminOrigin(undefined)).toBe(false)
    })
  })

  it("describes both policies for bootstrap logging", () => {
    expect(createService().originPolicyDescription).toBe(
      "cookies: any port on oboku.example.com; admin: not set",
    )
    expect(
      createService({ adminPublicUrl: "https://admin.example.org" })
        .originPolicyDescription,
    ).toBe(
      "cookies: any port on oboku.example.com; admin: https://admin.example.org",
    )
  })
})
