import { beforeEach, describe, expect, it, vi } from "vitest"
import { HttpClient, HttpClientError } from "./httpClient.shared"

describe("HttpClient", () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it("returns non-2xx responses by default like native fetch", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(new Response(null, { status: 401 })),
    )

    const client = new HttpClient()
    const response = await client.fetch("https://api.example.com/session")

    expect(response.status).toBe(401)
  })

  it("throws HttpClientError when using fetchOrThrow", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(new Response(null, { status: 401 })),
    )

    const client = new HttpClient()

    await expect(
      client.fetchOrThrow("https://api.example.com/session"),
    ).rejects.toBeInstanceOf(HttpClientError)
  })

  it("applies the base request init to every request, even without interceptors", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    const client = new HttpClient({ credentials: "include" })

    await client.fetch("https://api.example.com/session", {
      useInterceptors: false,
    })

    expect(fetchMock.mock.calls[0]?.[1]?.credentials).toBe("include")
  })

  it("lets a request's own init override the base request init", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    const client = new HttpClient({ credentials: "include" })

    await client.fetch("https://api.example.com/session", {
      credentials: "omit",
    })

    expect(fetchMock.mock.calls[0]?.[1]?.credentials).toBe("omit")
  })
})
