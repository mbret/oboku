import { type KoreaderSyncConnectionDto, ObokuErrorCode } from "@oboku/shared"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { HttpClientApiContext } from "../../http"
import type { HttpApiClientWeb } from "../../http/HttpClientApi.web"
import { HttpClientError } from "../../http/httpClient.shared"
import { useEnsureKoreaderSyncConnection } from "./useKoreaderSyncConnection"
import { usePushKoreaderPosition } from "./usePushKoreaderPosition"

const CONNECTION: KoreaderSyncConnectionDto = {
  serverUrl: "https://sync.example.com",
  username: "reader",
  connectedAt: "2026-01-01T00:00:00.000Z",
}

const POSITION = {
  document: "5d41402abc4b2a76b9719d911017c592",
  progress: "/body/DocFragment[3]/body/p[12]/text().0",
  percentage: 0.42,
  deviceId: "installation",
}

const KOREADER_SYNC_CONNECTION_GC_TIME_MS = 5 * 60 * 1000

const createApiError = (code: ObokuErrorCode) =>
  new HttpClientError(
    {
      response: new Response(),
      data: { errors: [{ code }] },
      status: 400,
      statusText: "",
      headers: {},
      config: {
        input: "https://api.example.com/koreader-sync-connection/progress",
      },
    },
    undefined,
  )

const renderConnectionHooks = ({
  pushRefusal,
}: {
  pushRefusal?: HttpClientError
} = {}) => {
  const sdkClient = {
    get: vi.fn().mockResolvedValue({ data: { connection: CONNECTION } }),
    put: vi.fn().mockRejectedValue(pushRefusal),
  }
  // test double: the hooks only call the generated client's `get` and `put`
  const client = { sdkClient } as unknown as HttpApiClientWeb
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: 0 } },
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <HttpClientApiContext.Provider value={client}>
        {children}
      </HttpClientApiContext.Provider>
    </QueryClientProvider>
  )

  const { result } = renderHook(
    () => ({
      ensureConnection: useEnsureKoreaderSyncConnection(),
      push: usePushKoreaderPosition(),
    }),
    { wrapper },
  )

  return { result, sdkClient }
}

describe("useEnsureKoreaderSyncConnection", () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it("asks the API once, then answers from the cache for a few minutes", async () => {
    vi.useFakeTimers()
    const { result, sdkClient } = renderConnectionHooks()

    await expect(result.current.ensureConnection()).resolves.toEqual({
      connection: CONNECTION,
    })
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_CONNECTION_GC_TIME_MS - 1)
    await expect(result.current.ensureConnection()).resolves.toEqual({
      connection: CONNECTION,
    })

    expect(sdkClient.get).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1)
    await result.current.ensureConnection()

    expect(sdkClient.get).toHaveBeenCalledTimes(2)
  })

  it.each([
    {
      refusal: "no connection",
      code: ObokuErrorCode.ERROR_KOREADER_SYNC_NOT_CONNECTED,
    },
    {
      refusal: "a key the server no longer accepts",
      code: ObokuErrorCode.ERROR_KOREADER_SYNC_SERVER_UNAUTHORIZED,
    },
  ])(
    "answers that there is no connection once a push is refused for $refusal",
    async ({ code }) => {
      const { result, sdkClient } = renderConnectionHooks({
        pushRefusal: createApiError(code),
      })
      await result.current.ensureConnection()

      await expect(result.current.push.mutateAsync(POSITION)).rejects.toThrow()

      await expect(result.current.ensureConnection()).resolves.toEqual({
        connection: null,
      })
      expect(sdkClient.get).toHaveBeenCalledTimes(1)
    },
  )

  it("keeps the connection after a push fails for another reason", async () => {
    const { result } = renderConnectionHooks({
      pushRefusal: createApiError(
        ObokuErrorCode.ERROR_KOREADER_SYNC_SERVER_UNREACHABLE,
      ),
    })
    await result.current.ensureConnection()

    await expect(result.current.push.mutateAsync(POSITION)).rejects.toThrow()

    await expect(result.current.ensureConnection()).resolves.toEqual({
      connection: CONNECTION,
    })
  })
})
