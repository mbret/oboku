import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Profile } from "../profiles/types"
import type { StoredProofKey } from "../auth/proofKey"
import type { HttpClientResponse } from "./httpClient.shared"

const { signRefreshProof, persistProofKey } = vi.hoisted(() => ({
  signRefreshProof: vi.fn(),
  persistProofKey: vi.fn(),
}))

vi.mock("../auth/proofKey", () => ({
  signRefreshProof,
  persistProofKey,
}))

// CryptoKey cannot be constructed in the test env; the client only forwards it.
const proofKey = {
  privateKey: {},
  publicJwk: { kty: "EC" },
} as unknown as StoredProofKey

const createProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: "reader",
  email: "reader@example.com",
  nameHex: "reader",
  dbName: "reader-db",
  needsRelogin: false,
  sessionId: "session-default",
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
const SIGNIN_URL = "https://api.example.com/auth/signin/email"
const LOGOUT_URL = "https://api.example.com/auth/logout"

const createSignInRequest = () => ({
  email: "b@example.com",
  password: "secret",
  installation_id: "installation",
  public_key: { kty: "EC" },
})

/** Deterministic single-queue stand-in for `navigator.locks`. */
const createNavigatorWithLockQueue = () => {
  let tail: Promise<unknown> = Promise.resolve()

  return {
    locks: {
      request: (_name: string, task: () => Promise<unknown>) => {
        const run = tail.then(() => task())

        tail = run.catch(() => undefined)

        return run
      },
    },
  }
}

const createRefreshResponse = () =>
  new Response(JSON.stringify({}), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  })

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
    persistProofKey.mockReset()
    persistProofKey.mockResolvedValue(undefined)
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

  it("bounds the refresh fetch with an abort signal so a stall cannot pin the cookies lock", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createRefreshResponse())

    vi.stubGlobal("fetch", fetchMock)

    const { client } = await createClient(createProfile())

    await client.refreshAuthSession()

    const [, init] = fetchMock.mock.calls[0] ?? []

    expect(init?.signal).toBeInstanceOf(AbortSignal)
    expect(init?.signal?.aborted).toBe(false)
  })

  it("omits the proof header when no key is registered (pre-binding session)", async () => {
    signRefreshProof.mockResolvedValue(undefined)

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createRefreshResponse())

    vi.stubGlobal("fetch", fetchMock)

    const { client } = await createClient(createProfile())

    await client.refreshToken()

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

  it("queues a sign-in behind an in-flight refresh so its cookies land last", async () => {
    vi.stubGlobal("navigator", createNavigatorWithLockQueue())

    const refreshDeferred = createDeferred<Response>()
    const fetchMock = vi.fn<typeof fetch>((input) => {
      const url = String(input)

      if (url === REFRESH_URL) {
        return refreshDeferred.promise
      }

      if (url === SIGNIN_URL) {
        return Promise.resolve(
          new Response(JSON.stringify({}), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        )
      }

      throw new Error(`Unexpected fetch call for ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const { client } = await createClient(createProfile())

    const refreshPromise = client.refreshAuthSession()

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    const signInPromise = client.signInWithEmail(
      createSignInRequest(),
      proofKey,
    )

    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(persistProofKey).not.toHaveBeenCalled()

    refreshDeferred.resolve(createRefreshResponse())

    await expect(refreshPromise).resolves.toBe(true)
    await expect(signInPromise).resolves.toMatchObject({ status: 200 })

    expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual([
      REFRESH_URL,
      SIGNIN_URL,
    ])
    expect(persistProofKey).toHaveBeenCalledTimes(1)
    expect(persistProofKey).toHaveBeenCalledWith(proofKey)
  })

  it("fails a rejected sign-in directly instead of refreshing and replaying it", async () => {
    const fetchMock = vi.fn<typeof fetch>((input) => {
      if (String(input) === SIGNIN_URL) {
        return Promise.resolve(new Response(null, { status: 401 }))
      }

      throw new Error(`Unexpected fetch call for ${String(input)}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const { client } = await createClient(createProfile())

    await expect(
      client.signInWithEmail(createSignInRequest(), proofKey),
    ).rejects.toThrow("Response error with status 401")
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(persistProofKey).not.toHaveBeenCalled()
  })

  it("does not retry a 401 request when the session switched during the refresh", async () => {
    const refreshDeferred = createDeferred<Response>()
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockReturnValueOnce(refreshDeferred.promise)

    vi.stubGlobal("fetch", fetchMock)

    const { client, getSession, setSession } = await createClient(
      createProfile({
        id: "a",
        email: "a@example.com",
        sessionId: "session-a",
      }),
    )

    const unauthorizedResponse = createUnauthorized({ authEpoch: 0 })
    const refreshPromise = client.refreshOnUnauthorized(unauthorizedResponse)

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    const sessionB = createProfile({
      id: "b",
      email: "b@example.com",
      sessionId: "session-b",
    })
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

  it("does not flag a fresh same-account session when a stale refresh is rejected mid-relogin", async () => {
    const refreshDeferred = createDeferred<Response>()
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockReturnValueOnce(refreshDeferred.promise)

    vi.stubGlobal("fetch", fetchMock)

    const { client, getSession, setSession } = await createClient(
      createProfile({ sessionId: "session-old" }),
    )

    const unauthorizedResponse = createUnauthorized({ authEpoch: 0 })
    const refreshPromise = client.refreshOnUnauthorized(unauthorizedResponse)

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    // Same account signs in again while the stale refresh is still in flight:
    // fresh row, same account id, new sessionId.
    setSession(createProfile({ sessionId: "session-new" }))

    refreshDeferred.resolve(
      new Response(null, { status: 401, statusText: "Unauthorized" }),
    )

    await expect(refreshPromise).resolves.toBe(unauthorizedResponse)
    expect(getSession()?.needsRelogin).toBe(false)
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

  describe("logout", () => {
    it("posts the session id to revoke it, skipping interceptors", async () => {
      const fetchMock = vi.fn<typeof fetch>((input) => {
        if (String(input) === LOGOUT_URL) {
          return Promise.resolve(
            new Response(JSON.stringify({}), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          )
        }

        throw new Error(`Unexpected fetch call for ${String(input)}`)
      })

      vi.stubGlobal("fetch", fetchMock)

      const { client } = await createClient(createProfile())

      await client.logout("session-1")

      expect(fetchMock).toHaveBeenCalledTimes(1)

      const [input, init] = fetchMock.mock.calls[0] ?? []

      expect(String(input)).toBe(LOGOUT_URL)
      expect(init?.credentials).toBe("include")
      expect(JSON.parse(String(init?.body))).toEqual({
        session_id: "session-1",
      })
    })
  })
})
