import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Profile } from "../profiles/types"
import type { HttpClientResponse } from "./httpClient.shared"

const createProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: "reader",
  accessToken: "access-token",
  refreshToken: "refresh-token",
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

const createRefreshResponse = (params: {
  accessToken: string
  refreshToken: string
}) =>
  new Response(JSON.stringify(params), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
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
    vi.doMock("../config/envs", async (importOriginal) => ({
      ...(await importOriginal<typeof import("../config/envs")>()),
      API_URL: "https://api.example.com",
    }))
  })

  it("deduplicates refreshes for the same refresh token", async () => {
    const refreshDeferred = createDeferred<Response>()
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockReturnValueOnce(refreshDeferred.promise)

    vi.stubGlobal("fetch", fetchMock)

    const { client, getSession } = await createClient(
      createProfile({
        accessToken: "expired-access-token",
        refreshToken: "token-a",
      }),
    )

    const firstRefresh = client.refreshAuthSession("token-a")
    const secondRefresh = client.refreshAuthSession("token-a")

    expect(firstRefresh).toBe(secondRefresh)
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    refreshDeferred.resolve(
      createRefreshResponse({
        accessToken: "fresh-access-token",
        refreshToken: "token-a-2",
      }),
    )

    await expect(firstRefresh).resolves.toBe(true)
    expect(getSession()).toEqual(
      createProfile({
        accessToken: "fresh-access-token",
        refreshToken: "token-a-2",
      }),
    )
  })

  it("dedupes concurrent 401s into a single refresh through the async store", async () => {
    let refreshCalls = 0

    const fetchMock = vi.fn<typeof fetch>((input) => {
      const url = String(input)

      if (url.includes("/auth/token?grant_type=refresh_token")) {
        refreshCalls += 1

        return Promise.resolve(
          createRefreshResponse({
            accessToken: "fresh-access-token",
            refreshToken: "token-a-2",
          }),
        )
      }

      if (url === "https://api.example.com/protected") {
        return Promise.resolve(
          new Response(null, { status: 401, statusText: "Unauthorized" }),
        )
      }

      throw new Error(`Unexpected fetch call for ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const { client } = await createClient(
      createProfile({
        accessToken: "expired-access-token",
        refreshToken: "token-a",
      }),
    )

    const makeUnauthorized = (): HttpClientResponse => ({
      response: new Response(null, { status: 401, statusText: "Unauthorized" }),
      data: undefined,
      status: 401,
      statusText: "Unauthorized",
      headers: {},
      config: {
        input: "https://api.example.com/protected",
        headers: {
          Authorization: "Bearer expired-access-token",
        },
      },
    })

    await Promise.all([
      client.refreshOnUnauthorized(makeUnauthorized()),
      client.refreshOnUnauthorized(makeUnauthorized()),
    ])

    expect(refreshCalls).toBe(1)

    const protectedRetries = fetchMock.mock.calls.filter(
      ([input]) => String(input) === "https://api.example.com/protected",
    )

    expect(protectedRetries).toHaveLength(2)

    for (const [, config] of protectedRetries) {
      expect(new Headers(config?.headers).get("Authorization")).toBe(
        "Bearer fresh-access-token",
      )
    }
  })

  it("starts a new refresh after a session switch and ignores stale results", async () => {
    const refreshDeferredA = createDeferred<Response>()
    const refreshDeferredB = createDeferred<Response>()
    const fetchMock = vi.fn<typeof fetch>((input) => {
      const url = String(input)

      if (url.includes("refresh_token=token-a")) {
        return refreshDeferredA.promise
      }

      if (url.includes("refresh_token=token-b")) {
        return refreshDeferredB.promise
      }

      throw new Error(`Unexpected fetch call for ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const authStateA = createProfile({
      accessToken: "expired-a",
      refreshToken: "token-a",
      email: "a@example.com",
      nameHex: "a",
      dbName: "a-db",
    })
    const authStateB = createProfile({
      accessToken: "expired-b",
      refreshToken: "token-b",
      email: "b@example.com",
      nameHex: "b",
      dbName: "b-db",
    })

    const { client, getSession, setSession } = await createClient(authStateA)

    const firstRefresh = client.refreshAuthSession("token-a")

    setSession(authStateB)

    const secondRefresh = client.refreshAuthSession("token-b")

    expect(firstRefresh).not.toBe(secondRefresh)
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

    refreshDeferredA.resolve(
      createRefreshResponse({
        accessToken: "fresh-a",
        refreshToken: "token-a-2",
      }),
    )

    await expect(firstRefresh).resolves.toBe(false)
    expect(getSession()).toEqual(authStateB)

    refreshDeferredB.resolve(
      createRefreshResponse({
        accessToken: "fresh-b",
        refreshToken: "token-b-2",
      }),
    )

    await expect(secondRefresh).resolves.toBe(true)
    expect(getSession()).toEqual(
      createProfile({
        accessToken: "fresh-b",
        refreshToken: "token-b-2",
        email: "b@example.com",
        nameHex: "b",
        dbName: "b-db",
      }),
    )
  })

  it("does not retry a 401 request when the refresh belongs to a stale session", async () => {
    const refreshDeferred = createDeferred<Response>()
    const fetchMock = vi.fn<typeof fetch>((input) => {
      const url = String(input)

      if (url.includes("refresh_token=token-a")) {
        return refreshDeferred.promise
      }

      throw new Error(`Unexpected fetch call for ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const { client, setSession } = await createClient(
      createProfile({
        accessToken: "expired-a",
        refreshToken: "token-a",
        email: "a@example.com",
        nameHex: "a",
        dbName: "a-db",
      }),
    )

    const unauthorizedResponse: HttpClientResponse = {
      response: new Response(null, { status: 401, statusText: "Unauthorized" }),
      data: undefined,
      status: 401,
      statusText: "Unauthorized",
      headers: {},
      config: {
        input: "https://api.example.com/protected",
      },
    }

    const refreshPromise = client.refreshOnUnauthorized(unauthorizedResponse)

    setSession(
      createProfile({
        accessToken: "expired-b",
        refreshToken: "token-b",
        email: "b@example.com",
        nameHex: "b",
        dbName: "b-db",
      }),
    )

    refreshDeferred.resolve(
      createRefreshResponse({
        accessToken: "fresh-a",
        refreshToken: "token-a-2",
      }),
    )

    await expect(refreshPromise).resolves.toBe(unauthorizedResponse)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("retries a 401 request only once with the refreshed access token", async () => {
    let refreshCalls = 0

    const fetchMock = vi.fn<typeof fetch>((input) => {
      const url = String(input)

      if (url.includes("/auth/token?grant_type=refresh_token")) {
        refreshCalls += 1

        if (refreshCalls > 1) {
          throw new Error(`Unexpected extra refresh for ${url}`)
        }

        return Promise.resolve(
          createRefreshResponse({
            accessToken: "fresh-access-token",
            refreshToken: "token-a-2",
          }),
        )
      }

      if (url === "https://api.example.com/protected") {
        return Promise.resolve(
          new Response(null, { status: 401, statusText: "Unauthorized" }),
        )
      }

      throw new Error(`Unexpected fetch call for ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const { client } = await createClient(
      createProfile({
        accessToken: "expired-access-token",
        refreshToken: "token-a",
      }),
    )

    const retriedResponse = await client.refreshOnUnauthorized({
      response: new Response(null, { status: 401, statusText: "Unauthorized" }),
      data: undefined,
      status: 401,
      statusText: "Unauthorized",
      headers: {},
      config: {
        input: "https://api.example.com/protected",
        headers: {
          Authorization: "Bearer expired-access-token",
        },
      },
    })

    expect(retriedResponse.status).toBe(401)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(
      new Headers(fetchMock.mock.calls[1]?.[1]?.headers).get("Authorization"),
    ).toBe("Bearer fresh-access-token")
  })

  it("retries with the current token without refreshing when it was already rotated", async () => {
    const fetchMock = vi.fn<typeof fetch>((input) => {
      const url = String(input)

      if (url.includes("/auth/token?grant_type=refresh_token")) {
        throw new Error("must not refresh when the token was already rotated")
      }

      if (url === "https://api.example.com/protected") {
        return Promise.resolve(new Response(null, { status: 200 }))
      }

      throw new Error(`Unexpected fetch call for ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const { client } = await createClient(
      createProfile({
        accessToken: "fresh-access-token",
        refreshToken: "token-fresh",
      }),
    )

    const result = await client.refreshOnUnauthorized({
      response: new Response(null, { status: 401, statusText: "Unauthorized" }),
      data: undefined,
      status: 401,
      statusText: "Unauthorized",
      headers: {},
      config: {
        input: "https://api.example.com/protected",
        headers: {
          Authorization: "Bearer stale-access-token",
        },
      },
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "https://api.example.com/protected",
    )
    expect(
      new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get("Authorization"),
    ).toBe("Bearer fresh-access-token")
    expect(result.status).toBe(200)
  })

  it("flags the session for relogin when the refresh request fails", async () => {
    const fetchMock = vi.fn<typeof fetch>((input) => {
      const url = String(input)

      if (url.includes("/auth/token?grant_type=refresh_token")) {
        return Promise.resolve(
          new Response(null, { status: 401, statusText: "Unauthorized" }),
        )
      }

      throw new Error(`Unexpected fetch call for ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const { client, getSession } = await createClient(
      createProfile({
        accessToken: "expired-access-token",
        refreshToken: "token-a",
      }),
    )

    const unauthorizedResponse: HttpClientResponse = {
      response: new Response(null, { status: 401, statusText: "Unauthorized" }),
      data: undefined,
      status: 401,
      statusText: "Unauthorized",
      headers: {},
      config: {
        input: "https://api.example.com/protected",
      },
    }

    const result = await client.refreshOnUnauthorized(unauthorizedResponse)

    expect(result).toBe(unauthorizedResponse)
    expect(getSession()?.needsRelogin).toBe(true)
  })

  it("does not flag the session when the refresh fails transiently", async () => {
    const fetchMock = vi.fn<typeof fetch>((input) => {
      const url = String(input)

      if (url.includes("/auth/token?grant_type=refresh_token")) {
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

    const { client, getSession } = await createClient(
      createProfile({
        accessToken: "expired-access-token",
        refreshToken: "token-a",
      }),
    )

    const unauthorizedResponse: HttpClientResponse = {
      response: new Response(null, { status: 401, statusText: "Unauthorized" }),
      data: undefined,
      status: 401,
      statusText: "Unauthorized",
      headers: {},
      config: {
        input: "https://api.example.com/protected",
      },
    }

    const result = await client.refreshOnUnauthorized(unauthorizedResponse)

    expect(result).toBe(unauthorizedResponse)
    expect(getSession()?.needsRelogin).toBe(false)
  })
})
