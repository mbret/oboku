import { AppConfigService } from "./AppConfigService"
import { TrustedOriginsService } from "./trusted-origin.service"

const createService = ({
  appPublicUrl = "https://oboku.example.com",
  extraOrigins = [] as string[],
} = {}) =>
  new TrustedOriginsService(
    // Config test double limited to what the service reads.
    {
      APP_PUBLIC_URL: appPublicUrl,
      API_CORS_TRUSTED_ORIGINS: extraOrigins,
    } as unknown as AppConfigService,
  )

describe("TrustedOriginsService", () => {
  it("trusts any port and scheme on the web app hostname (shared cookie jar)", () => {
    const service = createService()

    expect(service.isTrusted("https://oboku.example.com")).toBe(true)
    expect(service.isTrusted("https://oboku.example.com:8443")).toBe(true)
    expect(service.isTrusted("http://oboku.example.com:5173")).toBe(true)
  })

  it("rejects other hostnames, including subdomains", () => {
    const service = createService()

    expect(service.isTrusted("https://evil.example.net")).toBe(false)
    expect(service.isTrusted("https://sub.oboku.example.com")).toBe(false)
  })

  it("trusts explicitly configured extra origins by exact match", () => {
    const service = createService({
      extraOrigins: ["https://admin.example.org"],
    })

    expect(service.isTrusted("https://admin.example.org")).toBe(true)
    expect(service.isTrusted("https://admin.example.org:444")).toBe(false)
  })

  it("rejects missing or malformed origins", () => {
    const service = createService()

    expect(service.isTrusted(undefined)).toBe(false)
    expect(service.isTrusted("null")).toBe(false)
    expect(service.isTrusted("not a url")).toBe(false)
  })
})
