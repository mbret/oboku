import { createApiClient } from "@oboku/shared"
import { cleanup, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { HttpClientApiContext, type HttpApiClientWeb } from "../../../http"

const mocks = vi.hoisted(function createWebdavTestMocks() {
  return { createWebdavClient: vi.fn() }
})

vi.mock(
  "./auth/connect",
  async function mockCreateWebdavClient(importOriginal) {
    return {
      ...(await importOriginal<typeof import("./auth/connect")>()),
      createWebdavClient: mocks.createWebdavClient,
    }
  },
)

import { useTestWebdavConnection } from "./useTestWebdavConnection"

const API_URL = "https://api.oboku.test"

const KOOFR_CONNECTION = {
  url: "https://app.koofr.net/dav/Koofr",
  username: "reader@example.com",
  password: "koofr-app-password",
  allowSelfSigned: true,
  directory: "Books",
}

const renderTestWebdavConnection = (api: typeof fetch) => {
  // The hook only calls the API through `sdkClient`; the double cast lets a
  // client on a stubbed fetch stand in for the full client.
  const httpClientApi = {
    sdkClient: createApiClient({
      baseUrl: API_URL,
      throwOnError: true,
      fetch: api,
    }),
  } as unknown as HttpApiClientWeb

  return renderHook(useTestWebdavConnection, {
    wrapper: function HttpClientApiWrapper({
      children,
    }: {
      children: ReactNode
    }) {
      return (
        <HttpClientApiContext.Provider value={httpClientApi}>
          {children}
        </HttpClientApiContext.Provider>
      )
    },
  })
}

describe("useTestWebdavConnection", () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("lists the directory through oboku's server for a connector that uses it as a proxy", async () => {
    const api = vi.fn<typeof fetch>(async function serveDirectory() {
      return Response.json({ items: [] })
    })
    const { result } = renderTestWebdavConnection(api)

    const isConnected = await result.current({
      ...KOOFR_CONNECTION,
      proxyThroughServer: true,
    })

    expect(isConnected).toBe(true)
    const apiRequest = api.mock.lastCall?.[0]
    expect(apiRequest).toBeInstanceOf(Request)
    if (!(apiRequest instanceof Request)) return
    expect(apiRequest.url).toBe(`${API_URL}/connectors/webdav/directory`)
    expect(await apiRequest.json()).toEqual({
      url: KOOFR_CONNECTION.url,
      username: KOOFR_CONNECTION.username,
      providerCredentials: { password: KOOFR_CONNECTION.password },
      allowSelfSigned: true,
      path: "/Books",
    })
    expect(mocks.createWebdavClient).not.toHaveBeenCalled()
  })

  it("fails the test when oboku's server cannot list the directory", async () => {
    const api = vi.fn<typeof fetch>(async function refuseDirectory() {
      return Response.json(
        { errors: [{ code: "ERROR_PROVIDER_CONNECTION_SIGN_IN_REFUSED" }] },
        { status: 502 },
      )
    })
    const { result } = renderTestWebdavConnection(api)

    const isConnected = await result.current({
      ...KOOFR_CONNECTION,
      proxyThroughServer: true,
    })

    expect(isConnected).toBe(false)
  })

  it("lists the directory from the browser without the proxy setting", async () => {
    const getDirectoryContents = vi.fn(async function listBooks() {
      return []
    })
    mocks.createWebdavClient.mockReturnValue({ getDirectoryContents })
    const api = vi.fn<typeof fetch>()
    const { result } = renderTestWebdavConnection(api)

    const isConnected = await result.current(KOOFR_CONNECTION)

    expect(isConnected).toBe(true)
    expect(mocks.createWebdavClient).toHaveBeenCalledWith({
      url: KOOFR_CONNECTION.url,
      username: KOOFR_CONNECTION.username,
      password: KOOFR_CONNECTION.password,
    })
    expect(getDirectoryContents).toHaveBeenCalledWith("/Books")
    expect(api).not.toHaveBeenCalled()
  })

  it("returns the same test on every render, so the connection test runs once", () => {
    const { result, rerender } = renderTestWebdavConnection(vi.fn())
    const firstTest = result.current

    rerender()

    expect(result.current).toBe(firstTest)
  })
})
