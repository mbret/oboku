import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Profile } from "../profiles/types"
import type { HttpClientResponse } from "./httpClient.shared"

const { signRefreshProof } = vi.hoisted(() => ({
  signRefreshProof: vi.fn(),
}))

vi.mock("../auth/proofKey", () => ({
  signRefreshProof,
}))

const createProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: "reader",
  email: "reader@example.com",
  nameHex: "reader",
  dbName: "reader-db",
  needsRelogin: false,
  ...overrides,
})

const createDeferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve
    reject = nextReject
  })

  return {
    promise,
    resolve,
    reject,
  }
}

const REFRESH_URL =
  "https://api.example.com/auth/token?grant_type=refresh_token"

const createRefreshResponse = () =>
  new Response(
    JSON.stringify({
      accessToken: "fresh-access-token",
      refreshToken: "rotated-refresh-token",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
  )

const createUnauthorized = (
  config: Partial<HttpClientResponse["config"]> = {},
): HttpClientResponse => ({
  response: new Response(null, { status: 401, statusText: "Unauthorized" }),
  data: undefined,
  status: 401,
  statusText: "Unauthorized",
  headers: {},
  config: {
    input: "https://api.example.com/protected",
    ...config,
  },
})

/**
 * The client reads and persists its session through an injected store, which in
 * the app is backed by react-query/Dexie. The tests back it with a plain
 * in-memory session so the refresh-flow assertions stay focused on the client
 * and independent of that wiring.
 */
const createClient = async (initialSession: Profile | null = null) => {
  const { HttpApiClientWeb } = await import("./HttpClientApi.web")

  let session = initialSession

  const client = new HttpApiClientWeb()

  client.configureSessionStore({
    get: async () => session,
    set: async (next) => {
      session = next
    },
  })

  return {
    client,
    getSession: () => session,
    setSession: (next: Profile | null) => {
      session = next
    },
  }
}

describe("HttpApiClientWeb auth refresh", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
    signRefreshProof.mockReset()
    signRefreshProof.mockResolvedValue("proof-jwt")
    vi.doMock("../config/envs", async (importOriginal) => ({
      ...(await importOriginal<typeof import("../config/envs")>()),
      API_URL: "https://api.example.com",
    }))
  })

  it("refreshes over the cookie with a DPoP proof and no token in the URL", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createRefreshResponse())

    vi.stubGlobal("fetch", fetchMock)

    const { client } = await createClient(createProfile())

    await expect(client.refreshAuthSession()).resolves.toBe(true)

    const [input, init] = fetchMock.mock.calls[0] ?? []

    expect(String(input)).toBe(REFRESH_URL)
    expect(init?.credentials).toBe("include")
    expect(new Headers(init?.headers).get("DPoP")).toBe("proof-jwt")
    expect(signRefreshProof).toHaveBeenCalledWith(REFRESH_URL)
  })

  it("omits the proof header when no key is registered (pre-binding session)", async () => {
    signRefreshProof.mockResolvedValue(undefined)

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createRefreshResponse())

    vi.stubGlobal("fetch", fetchMock)

    const { client } = await createClient(createProfile())

    await client.refreshToken({ useInterceptors: false })

    const [input, init] = fetchMock.mock.calls[0] ?? []

    expect(String(input)).toBe(REFRESH_URL)
    expect(new Headers(init?.headers).get("DPoP")).toBeNull()
  })

  it("deduplicates concurrent refreshes", async () => {
    const refreshDeferred = createDeferred<Response>()
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockReturnValueOnce(refreshDeferred.promise)

    vi.stubGlobal("fetch", fetchMock)

    const { client } = await createClient(createProfile())

    const firstRefresh = client.refreshAuthSession()
    const secondRefresh = client.refreshAuthSession()

    expect(firstRefresh).toBe(secondRefresh)

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    refreshDeferred.resolve(createRefreshResponse())

    await expect(firstRefresh).resolves.toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("dedupes concurrent 401s into a single refresh and retries them cookie-only", async () => {
    let refreshCalls = 0

    const fetchMock = vi.fn<typeof fetch>((input) => {
      const url = String(input)

      if (url === REFRESH_URL) {
        refreshCalls += 1

        return Promise.resolve(createRefreshResponse())
      }

      if (url === "https://api.example.com/protected") {
        return Promise.resolve(
          new Response(null, { status: 401, statusText: "Unauthorized" }),
        )
      }

      throw new Error(`Unexpected fetch call for ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const { client } = await createClient(createProfile())

    await Promise.all([
      client.refreshOnUnauthorized(createUnauthorized({ authEpoch: 0 })),
      client.refreshOnUnauthorized(createUnauthorized({ authEpoch: 0 })),
    ])

    expect(refreshCalls).toBe(1)

    const protectedRetries = fetchMock.mock.calls.filter(
      ([input]) => String(input) === "https://api.example.com/protected",
    )

    expect(protectedRetries).toHaveLength(2)

    for (const [, config] of protectedRetries) {
      expect(new Headers(config?.headers).get("Authorization")).toBeNull()
      expect(config?.credentials).toBe("include")
    }
  })

  it("retries without refreshing when the session was already refreshed since the request", async () => {
    const fetchMock = vi.fn<typeof fetch>((input) => {
      const url = String(input)

      if (url === REFRESH_URL) {
        return Promise.resolve(createRefreshResponse())
      }

      if (url === "https://api.example.com/protected") {
        return Promise.resolve(new Response(null, { status: 200 }))
      }

      throw new Error(`Unexpected fetch call for ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const { client } = await createClient(createProfile())

    // one applied refresh moves the client past epoch 0
    await client.refreshAuthSession()

    const staleEpochResponse = createUnauthorized({ authEpoch: 0 })
    const result = await client.refreshOnUnauthorized(staleEpochResponse)

    expect(result.status).toBe(200)

    const refreshCalls = fetchMock.mock.calls.filter(
      ([input]) => String(input) === REFRESH_URL,
    )

    expect(refreshCalls).toHaveLength(1)
  })

  it("returns the 401 untouched when no session exists", async () => {
    const fetchMock = vi.fn<typeof fetch>()

    vi.stubGlobal("fetch", fetchMock)

    const { client } = await createClient(null)

    const unauthorizedResponse = createUnauthorized()

    await expect(
      client.refreshOnUnauthorized(unauthorizedResponse),
    ).resolves.toBe(unauthorizedResponse)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("does not retry a 401 request when the session switched during the refresh", async () => {
    const refreshDeferred = createDeferred<Response>()
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockReturnValueOnce(refreshDeferred.promise)

    vi.stubGlobal("fetch", fetchMock)

    const { client, getSession, setSession } = await createClient(
      createProfile({ id: "a", email: "a@example.com" }),
    )

    const unauthorizedResponse = createUnauthorized({ authEpoch: 0 })
    const refreshPromise = client.refreshOnUnauthorized(unauthorizedResponse)

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    const sessionB = createProfile({ id: "b", email: "b@example.com" })
    setSession(sessionB)

    refreshDeferred.resolve(createRefreshResponse())

    await expect(refreshPromise).resolves.toBe(unauthorizedResponse)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(getSession()).toEqual(sessionB)
  })

  it("retries a 401 request only once after a refresh", async () => {
    let refreshCalls = 0

    const fetchMock = vi.fn<typeof fetch>((input) => {
      const url = String(input)

      if (url === REFRESH_URL) {
        refreshCalls += 1

        if (refreshCalls > 1) {
          throw new Error(`Unexpected extra refresh for ${url}`)
        }

        return Promise.resolve(createRefreshResponse())
      }

      if (url === "https://api.example.com/protected") {
        return Promise.resolve(
          new Response(null, { status: 401, statusText: "Unauthorized" }),
        )
      }

      throw new Error(`Unexpected fetch call for ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const { client } = await createClient(createProfile())

    const retriedResponse = await client.refreshOnUnauthorized(
      createUnauthorized({ authEpoch: 0 }),
    )

    expect(retriedResponse.status).toBe(401)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("clears the relogin flag once a refresh succeeds", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createRefreshResponse())

    vi.stubGlobal("fetch", fetchMock)

    const { client, getSession } = await createClient(
      createProfile({ needsRelogin: true }),
    )

    await expect(client.refreshAuthSession()).resolves.toBe(true)
    expect(getSession()?.needsRelogin).toBe(false)
  })

  it("flags the session for relogin when the refresh is rejected", async () => {
    const fetchMock = vi.fn<typeof fetch>((input) => {
      const url = String(input)

      if (url === REFRESH_URL) {
        return Promise.resolve(
          new Response(null, { status: 401, statusText: "Unauthorized" }),
        )
      }

      throw new Error(`Unexpected fetch call for ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const { client, getSession } = await createClient(createProfile())

    const unauthorizedResponse = createUnauthorized()
    const result = await client.refreshOnUnauthorized(unauthorizedResponse)

    expect(result).toBe(unauthorizedResponse)
    expect(getSession()?.needsRelogin).toBe(true)
  })

  it("does not flag the session when the refresh fails transiently", async () => {
    const fetchMock = vi.fn<typeof fetch>((input) => {
      const url = String(input)

      if (url === REFRESH_URL) {
        // A transient failure (5xx / network blip), not an auth rejection.
        return Promise.resolve(
          new Response(null, {
            status: 503,
            statusText: "Service Unavailable",
          }),
        )
      }

      throw new Error(`Unexpected fetch call for ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const { client, getSession } = await createClient(createProfile())

    const unauthorizedResponse = createUnauthorized()
    const result = await client.refreshOnUnauthorized(unauthorizedResponse)

    expect(result).toBe(unauthorizedResponse)
    expect(getSession()?.needsRelogin).toBe(false)
  })
})
