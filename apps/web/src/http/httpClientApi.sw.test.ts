import { beforeEach, describe, expect, it, vi } from "vitest"
import { httpClientApi } from "./httpClientApi.sw"

describe("httpClientApi service worker client", () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it("sends requests with cookies and no Authorization header", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("cover", { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    const { status } = await httpClientApi.fetch(
      "https://api.example.com/covers/1",
    )

    expect(status).toBe(200)
    expect(fetchMock.mock.calls[0]?.[1]?.credentials).toBe("include")
    expect(
      new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get("Authorization"),
    ).toBeNull()
  })

  it("propagates a 401 instead of refreshing (the main thread owns refresh)", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
    vi.stubGlobal("fetch", fetchMock)

    const { status } = await httpClientApi.fetch(
      "https://api.example.com/covers/1",
    )

    expect(status).toBe(401)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
