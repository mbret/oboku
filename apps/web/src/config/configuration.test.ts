import { beforeEach, describe, expect, it, vi } from "vitest"

describe("configuration.fetchConfig", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  it("uses fetchOrThrow for HTTP responses", async () => {
    const fetch = vi.fn()
    const fetchOrThrow = vi.fn().mockResolvedValue({
      data: {
        GOOGLE_CLIENT_ID: "client-id",
      },
    })
    const Logger = {
      log: vi.fn(),
      error: vi.fn(),
    }

    vi.doMock("../http/httpClientApi.web", () => ({
      httpClientApi: {
        fetch,
        fetchOrThrow,
      },
    }))
    vi.doMock("../debug/logger.shared", () => ({
      Logger,
    }))
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    })
    vi.stubGlobal("window", {
      location: {
        protocol: "https:",
        hostname: "reader.example.com",
      },
    })

    const { configuration } = await import("./configuration")

    await expect(configuration.fetchConfig()).resolves.toEqual({
      GOOGLE_CLIENT_ID: "client-id",
    })
    expect(fetchOrThrow).toHaveBeenCalledWith(
      "https://reader.example.com:3000/web/config",
    )
    expect(fetch).not.toHaveBeenCalled()
  })

  it("logs and returns undefined when fetchOrThrow rejects", async () => {
    const error = new Error("boom")
    const fetchOrThrow = vi.fn().mockRejectedValue(error)
    const Logger = {
      log: vi.fn(),
      error: vi.fn(),
    }

    vi.doMock("../http/httpClientApi.web", () => ({
      httpClientApi: {
        fetch: vi.fn(),
        fetchOrThrow,
      },
    }))
    vi.doMock("../debug/logger.shared", () => ({
      Logger,
    }))
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    })
    vi.stubGlobal("window", {
      location: {
        protocol: "https:",
        hostname: "reader.example.com",
      },
    })

    const { configuration } = await import("./configuration")

    await expect(configuration.fetchConfig()).resolves.toBeUndefined()
    expect(Logger.error).toHaveBeenCalledWith("Failed to fetch config", error)
  })
})
