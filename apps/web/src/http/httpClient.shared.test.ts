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
})
