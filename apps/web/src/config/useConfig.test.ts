import { beforeEach, describe, expect, it, vi } from "vitest"
import type { GetWebConfigResponse } from "@oboku/shared"
import type { HttpApiClient } from "../http/httpClientApi.web"
import { buildConfig } from "./useConfig"

// fetchConfig only touches `fetchOrThrow`; the double cast lets a minimal stub
// stand in for the full client without recreating every domain method.
const createHttpClientApiStub = (
  overrides: Partial<HttpApiClient>,
): HttpApiClient =>
  ({ fetch: vi.fn(), ...overrides }) as unknown as HttpApiClient

const baseServerConfig: GetWebConfigResponse = {
  MICROSOFT_APPLICATION_AUTHORITY: "https://login.microsoftonline.com/common",
  FEATURE_SERVER_SYNC_ENABLED: false,
  SHOW_DISABLED_PLUGINS: false,
}

describe("buildConfig", () => {
  it("merges the static config into the result", () => {
    const config = buildConfig(baseServerConfig)

    expect(config).toMatchObject({
      SEARCH_MAX_PREVIEW_ITEMS: 8,
      COLLECTION_EMPTY_ID: "oboku_dangling_books",
      CLEANUP_DANGLING_LINKS_INTERVAL: 1000 * 60 * 10,
      MINIMUM_TOKEN_VALIDITY_MS: 1000 * 60 * 5,
    })
    expect(config.MICROSOFT_APPLICATION_AUTHORITY).toBe(
      "https://login.microsoftonline.com/common",
    )
  })

  it("derives GOOGLE_APP_ID from the client id prefix", () => {
    const config = buildConfig({
      ...baseServerConfig,
      GOOGLE_CLIENT_ID: "12345-abcdef.apps.googleusercontent.com",
    })

    expect(config.GOOGLE_APP_ID).toBe("12345")
  })

  it("enables the google sign-in feature only when a client id is present", () => {
    expect(buildConfig(baseServerConfig).FEATURE_GOOGLE_SIGN_ENABLED).toBe(
      false,
    )
    expect(
      buildConfig({ ...baseServerConfig, GOOGLE_CLIENT_ID: "client" })
        .FEATURE_GOOGLE_SIGN_ENABLED,
    ).toBe(true)
  })

  it("enables google drive only when client id, api key and derived app id are all present", () => {
    expect(
      buildConfig({
        ...baseServerConfig,
        GOOGLE_CLIENT_ID: "12345-abcdef",
        GOOGLE_API_KEY: "api-key",
      }).FEATURE_GOOGLE_DRIVE_ENABLED,
    ).toBe(true)

    expect(
      buildConfig({
        ...baseServerConfig,
        GOOGLE_CLIENT_ID: "12345-abcdef",
      }).FEATURE_GOOGLE_DRIVE_ENABLED,
    ).toBe(false)
  })

  it("derives dropbox and one-drive feature flags from their client ids", () => {
    const config = buildConfig({
      ...baseServerConfig,
      DROPBOX_CLIENT_ID: "dropbox",
      MICROSOFT_APPLICATION_CLIENT_ID: "microsoft",
    })

    expect(config.FEATURE_DROPBOX_ENABLED).toBe(true)
    expect(config.FEATURE_ONE_DRIVE_ENABLED).toBe(true)
  })
})

describe("fetchConfig", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  it("fetches, validates and consolidates the web config", async () => {
    const fetchOrThrow = vi.fn().mockResolvedValue({
      data: {
        GOOGLE_CLIENT_ID: "12345-client",
        MICROSOFT_APPLICATION_AUTHORITY:
          "https://login.microsoftonline.com/common",
        FEATURE_SERVER_SYNC_ENABLED: true,
        SHOW_DISABLED_PLUGINS: false,
      },
    })
    const httpClientApi = createHttpClientApiStub({ fetchOrThrow })

    vi.stubGlobal("window", {
      location: {
        protocol: "https:",
        hostname: "reader.example.com",
      },
    })

    const { fetchConfig } = await import("./useConfig")

    const config = await fetchConfig(httpClientApi)

    expect(fetchOrThrow).toHaveBeenCalledWith(
      "https://reader.example.com:3000/web/config",
    )
    expect(httpClientApi.fetch).not.toHaveBeenCalled()
    expect(config.GOOGLE_CLIENT_ID).toBe("12345-client")
    expect(config.GOOGLE_APP_ID).toBe("12345")
    expect(config.FEATURE_GOOGLE_SIGN_ENABLED).toBe(true)
    expect(config.FEATURE_SERVER_SYNC_ENABLED).toBe(true)
  })

  it("rejects when the request fails", async () => {
    const error = new Error("boom")
    const fetchOrThrow = vi.fn().mockRejectedValue(error)
    const httpClientApi = createHttpClientApiStub({ fetchOrThrow })

    vi.stubGlobal("window", {
      location: {
        protocol: "https:",
        hostname: "reader.example.com",
      },
    })

    const { fetchConfig } = await import("./useConfig")

    await expect(fetchConfig(httpClientApi)).rejects.toBe(error)
  })
})
