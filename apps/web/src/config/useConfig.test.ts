import { beforeEach, describe, expect, it, vi } from "vitest"
import { QueryClient } from "@tanstack/react-query"
import { createApiClient, type WebGetConfigResponse } from "@oboku/shared"
import type { HttpApiClientWeb } from "../http"
import {
  buildConfig,
  fetchConfig,
  seedWebConfigFromCache,
  webConfigQueryKey,
} from "./useConfig"
import { readWebConfigCache } from "./configCache"

vi.mock("./configCache", () => ({
  saveWebConfigCache: vi.fn(),
  readWebConfigCache: vi.fn(),
}))

// fetchConfig only touches `sdkClient`; the double cast lets a minimal stub
// stand in for the full client without recreating every domain method.
const createHttpClientApiStub = (sdkFetch: typeof fetch): HttpApiClientWeb =>
  ({
    sdkClient: createApiClient({
      baseUrl: "https://api.example.com",
      throwOnError: true,
      fetch: sdkFetch,
    }),
  }) as unknown as HttpApiClientWeb

const baseServerConfig: WebGetConfigResponse = {
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
  it("fetches, validates and consolidates the web config", async () => {
    const sdkFetch = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          GOOGLE_CLIENT_ID: "12345-client",
          MICROSOFT_APPLICATION_AUTHORITY:
            "https://login.microsoftonline.com/common",
          FEATURE_SERVER_SYNC_ENABLED: true,
          SHOW_DISABLED_PLUGINS: false,
        }),
        { headers: { "Content-Type": "application/json" } },
      ),
    )

    const config = await fetchConfig(createHttpClientApiStub(sdkFetch))

    const [request] = sdkFetch.mock.calls[0] ?? []

    expect(request instanceof Request ? request.url : String(request)).toBe(
      "https://api.example.com/web/config",
    )
    expect(config.GOOGLE_CLIENT_ID).toBe("12345-client")
    expect(config.GOOGLE_APP_ID).toBe("12345")
    expect(config.FEATURE_GOOGLE_SIGN_ENABLED).toBe(true)
    expect(config.FEATURE_SERVER_SYNC_ENABLED).toBe(true)
  })

  it("rejects when the request fails", async () => {
    const error = new Error("boom")
    const sdkFetch = vi.fn<typeof fetch>().mockRejectedValue(error)

    await expect(fetchConfig(createHttpClientApiStub(sdkFetch))).rejects.toBe(
      error,
    )
  })
})

describe("seedWebConfigFromCache", () => {
  beforeEach(() => {
    vi.mocked(readWebConfigCache).mockReset()
  })

  it("seeds the query from the cached server config", async () => {
    vi.mocked(readWebConfigCache).mockResolvedValue(baseServerConfig)
    const queryClient = new QueryClient()

    await seedWebConfigFromCache(queryClient)

    expect(queryClient.getQueryData(webConfigQueryKey)).toEqual(
      buildConfig(baseServerConfig),
    )
  })

  it("does not overwrite a config already in the cache", async () => {
    vi.mocked(readWebConfigCache).mockResolvedValue(baseServerConfig)
    const queryClient = new QueryClient()
    const existing = buildConfig({
      ...baseServerConfig,
      GOOGLE_CLIENT_ID: "already-present",
    })
    queryClient.setQueryData(webConfigQueryKey, existing)

    await seedWebConfigFromCache(queryClient)

    expect(queryClient.getQueryData(webConfigQueryKey)).toBe(existing)
  })

  it("no-ops when the offline cache is empty", async () => {
    vi.mocked(readWebConfigCache).mockResolvedValue(undefined)
    const queryClient = new QueryClient()

    await seedWebConfigFromCache(queryClient)

    expect(queryClient.getQueryData(webConfigQueryKey)).toBeUndefined()
  })
})
