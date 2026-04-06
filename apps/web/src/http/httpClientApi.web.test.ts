import { beforeEach, describe, expect, it, vi } from "vitest"
import type { AuthSession } from "../auth/types"
import type { HttpClientResponse } from "./httpClient.shared"

const createAuthSession = (
  overrides: Partial<AuthSession> = {},
): AuthSession => ({
  accessToken: "access-token",
  refreshToken: "refresh-token",
  email: "reader@example.com",
  nameHex: "reader",
  dbName: "reader-db",
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

describe("httpClientApi web auth refresh", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
    vi.doMock("../config/configuration", () => ({
      configuration: {
        API_URL: "https://api.example.com",
      },
    }))
  })

  it("deduplicates refreshes for the same refresh token", async () => {
    const refreshDeferred = createDeferred<Response>()
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockReturnValueOnce(refreshDeferred.promise)

    vi.stubGlobal("fetch", fetchMock)

    const { authStateSignal } = await import("../auth/states.web")
    const { refreshAuthSession } = await import("./httpClientApi.web")

    authStateSignal.update(
      createAuthSession({
        accessToken: "expired-access-token",
        refreshToken: "token-a",
      }),
    )

    const firstRefresh = refreshAuthSession("token-a")
    const secondRefresh = refreshAuthSession("token-a")

    expect(firstRefresh).toBe(secondRefresh)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    refreshDeferred.resolve(
      createRefreshResponse({
        accessToken: "fresh-access-token",
        refreshToken: "token-a-2",
      }),
    )

    await expect(firstRefresh).resolves.toBe(true)
    expect(authStateSignal.getValue()).toEqual(
      createAuthSession({
        accessToken: "fresh-access-token",
        refreshToken: "token-a-2",
      }),
    )
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

    const { authStateSignal } = await import("../auth/states.web")
    const { refreshAuthSession } = await import("./httpClientApi.web")

    const authStateA = createAuthSession({
      accessToken: "expired-a",
      refreshToken: "token-a",
      email: "a@example.com",
      nameHex: "a",
      dbName: "a-db",
    })
    const authStateB = createAuthSession({
      accessToken: "expired-b",
      refreshToken: "token-b",
      email: "b@example.com",
      nameHex: "b",
      dbName: "b-db",
    })

    authStateSignal.update(authStateA)

    const firstRefresh = refreshAuthSession("token-a")

    authStateSignal.update(authStateB)

    const secondRefresh = refreshAuthSession("token-b")

    expect(firstRefresh).not.toBe(secondRefresh)
    expect(fetchMock).toHaveBeenCalledTimes(2)

    refreshDeferredA.resolve(
      createRefreshResponse({
        accessToken: "fresh-a",
        refreshToken: "token-a-2",
      }),
    )

    await expect(firstRefresh).resolves.toBe(false)
    expect(authStateSignal.getValue()).toEqual(authStateB)

    refreshDeferredB.resolve(
      createRefreshResponse({
        accessToken: "fresh-b",
        refreshToken: "token-b-2",
      }),
    )

    await expect(secondRefresh).resolves.toBe(true)
    expect(authStateSignal.getValue()).toEqual(
      createAuthSession({
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

    const { authStateSignal } = await import("../auth/states.web")
    const { refreshOnUnauthorized } = await import("./httpClientApi.web")

    authStateSignal.update(
      createAuthSession({
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

    const refreshPromise = refreshOnUnauthorized(unauthorizedResponse)

    authStateSignal.update(
      createAuthSession({
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
})
