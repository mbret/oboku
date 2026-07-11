import { beforeEach, describe, expect, it, vi } from "vitest"

const { signRefreshProof } = vi.hoisted(() => ({
  signRefreshProof: vi.fn(),
}))

vi.mock("../auth/proofKey", () => ({
  signRefreshProof,
}))

const API_URL = "https://api.example.com"
const REFRESH_URL = `${API_URL}/auth/token?grant_type=refresh_token`
const COVER_URL = `${API_URL}/covers/1`

const createRefreshResponse = () =>
  new Response(
    JSON.stringify({
      accessToken: "fresh-access-token",
      refreshToken: "rotated-refresh-token",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  )

const createClient = async () => {
  const { serviceWorkerConfiguration } = await import(
    "../config/configuration.sw"
  )

  serviceWorkerConfiguration.update({ API_URL })

  const { httpClientApi } = await import("./httpClientApi.sw")

  return httpClientApi
}

describe("httpClientApi service worker client", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
    signRefreshProof.mockReset()
    signRefreshProof.mockResolvedValue("proof-jwt")
  })

  it("sends requests with cookies and no Authorization header", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("cover", { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    const httpClientApi = await createClient()

    const { status } = await httpClientApi.fetch(COVER_URL)

    expect(status).toBe(200)
    expect(fetchMock.mock.calls[0]?.[1]?.credentials).toBe("include")
    expect(
      new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get("Authorization"),
    ).toBeNull()
  })

  it("refreshes over the cookie with a DPoP proof on a 401, then replays the request cookie-only", async () => {
    let coverCalls = 0

    const fetchMock = vi.fn<typeof fetch>((input) => {
      const url = String(input)

      if (url === REFRESH_URL) {
        return Promise.resolve(createRefreshResponse())
      }

      if (url === COVER_URL) {
        coverCalls += 1

        return Promise.resolve(
          new Response("cover", { status: coverCalls === 1 ? 401 : 200 }),
        )
      }

      throw new Error(`Unexpected fetch call for ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const httpClientApi = await createClient()

    const { status } = await httpClientApi.fetch(COVER_URL)

    expect(status).toBe(200)
    expect(coverCalls).toBe(2)

    const [refreshInput, refreshInit] =
      fetchMock.mock.calls.find(([input]) => String(input) === REFRESH_URL) ??
      []

    expect(String(refreshInput)).toBe(REFRESH_URL)
    expect(refreshInit?.credentials).toBe("include")
    expect(new Headers(refreshInit?.headers).get("DPoP")).toBe("proof-jwt")

    const [, retryInit] = fetchMock.mock.calls.filter(
      ([input]) => String(input) === COVER_URL,
    )[1] ?? [undefined, undefined]

    expect(new Headers(retryInit?.headers).get("Authorization")).toBeNull()
    expect(retryInit?.credentials).toBe("include")
  })

  it("deduplicates concurrent 401s into a single refresh", async () => {
    let refreshCalls = 0

    const fetchMock = vi.fn<typeof fetch>((input) => {
      const url = String(input)

      if (url === REFRESH_URL) {
        refreshCalls += 1

        return Promise.resolve(createRefreshResponse())
      }

      if (url === COVER_URL) {
        return Promise.resolve(new Response(null, { status: 401 }))
      }

      throw new Error(`Unexpected fetch call for ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const httpClientApi = await createClient()

    await Promise.all([
      httpClientApi.fetch(COVER_URL),
      httpClientApi.fetch(COVER_URL),
    ])

    expect(refreshCalls).toBe(1)
  })

  it("returns the 401 without looping when the refresh does not fix it", async () => {
    const fetchMock = vi.fn<typeof fetch>((input) => {
      const url = String(input)

      if (url === REFRESH_URL) {
        return Promise.resolve(createRefreshResponse())
      }

      if (url === COVER_URL) {
        return Promise.resolve(new Response(null, { status: 401 }))
      }

      throw new Error(`Unexpected fetch call for ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const httpClientApi = await createClient()

    const { status } = await httpClientApi.fetch(COVER_URL)

    expect(status).toBe(401)

    const refreshCalls = fetchMock.mock.calls.filter(
      ([input]) => String(input) === REFRESH_URL,
    )

    expect(refreshCalls).toHaveLength(1)
  })

  it("waits for the shared auth cookies lock before refreshing", async () => {
    let releaseLock!: () => void
    const lockHeldByAnotherContext = new Promise<void>((resolve) => {
      releaseLock = resolve
    })

    vi.stubGlobal("navigator", {
      locks: {
        request: (_name: string, task: () => Promise<unknown>) =>
          lockHeldByAnotherContext.then(() => task()),
      },
    })

    let coverCalls = 0

    const fetchMock = vi.fn<typeof fetch>((input) => {
      const url = String(input)

      if (url === REFRESH_URL) {
        return Promise.resolve(createRefreshResponse())
      }

      if (url === COVER_URL) {
        coverCalls += 1

        return Promise.resolve(
          new Response("cover", { status: coverCalls === 1 ? 401 : 200 }),
        )
      }

      throw new Error(`Unexpected fetch call for ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const httpClientApi = await createClient()

    const responsePromise = httpClientApi.fetch(COVER_URL)

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual([
      COVER_URL,
    ])

    releaseLock()

    const { status } = await responsePromise

    expect(status).toBe(200)
    expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual([
      COVER_URL,
      REFRESH_URL,
      COVER_URL,
    ])
  })

  it("returns the 401 when the refresh itself is rejected, without retrying", async () => {
    let coverCalls = 0

    const fetchMock = vi.fn<typeof fetch>((input) => {
      const url = String(input)

      if (url === REFRESH_URL) {
        return Promise.resolve(new Response(null, { status: 401 }))
      }

      if (url === COVER_URL) {
        coverCalls += 1

        return Promise.resolve(new Response(null, { status: 401 }))
      }

      throw new Error(`Unexpected fetch call for ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const httpClientApi = await createClient()

    const { status } = await httpClientApi.fetch(COVER_URL)

    expect(status).toBe(401)
    expect(coverCalls).toBe(1)
  })
})
