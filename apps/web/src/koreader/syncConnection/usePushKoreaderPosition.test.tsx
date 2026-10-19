import { ObokuErrorCode } from "@oboku/shared"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { HttpClientApiContext } from "../../http"
import type { HttpApiClientWeb } from "../../http/HttpClientApi.web"
import { HttpClientError } from "../../http/httpClient.shared"
import { setKoreaderSyncConnectionQueryDefaults } from "./queryKeys"
import { useIsKoreaderSyncDisconnected } from "./useIsKoreaderSyncDisconnected"
import { usePushKoreaderPosition } from "./usePushKoreaderPosition"

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

const createAppQueryClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: 0 } },
  })
  setKoreaderSyncConnectionQueryDefaults(queryClient)

  return queryClient
}

const renderPushHooks = (refusal: HttpClientError) => {
  // test double: the push only calls the generated client's `put`
  const client = {
    sdkClient: { put: vi.fn().mockRejectedValue(refusal) },
  } as unknown as HttpApiClientWeb
  const queryClient = createAppQueryClient()

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <HttpClientApiContext.Provider value={client}>
        {children}
      </HttpClientApiContext.Provider>
    </QueryClientProvider>
  )

  return renderHook(
    () => ({
      push: usePushKoreaderPosition(),
      isKoreaderSyncDisconnected: useIsKoreaderSyncDisconnected(),
    }),
    { wrapper },
  )
}

describe("usePushKoreaderPosition", () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
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
    "remembers that the account can't push after a push refused for $refusal",
    async ({ code }) => {
      const { result } = renderPushHooks(createApiError(code))

      expect(result.current.isKoreaderSyncDisconnected()).toBe(false)

      await expect(result.current.push.mutateAsync(POSITION)).rejects.toThrow()

      expect(result.current.isKoreaderSyncDisconnected()).toBe(true)
    },
  )

  it("leaves the connection alone after a push fails for another reason", async () => {
    const { result } = renderPushHooks(
      createApiError(ObokuErrorCode.ERROR_KOREADER_SYNC_SERVER_UNREACHABLE),
    )

    await expect(result.current.push.mutateAsync(POSITION)).rejects.toThrow()

    expect(result.current.isKoreaderSyncDisconnected()).toBe(false)
  })

  it("keeps knowing it for a few minutes while no screen shows the connection", async () => {
    vi.useFakeTimers()
    const { result } = renderPushHooks(
      createApiError(ObokuErrorCode.ERROR_KOREADER_SYNC_NOT_CONNECTED),
    )

    await expect(result.current.push.mutateAsync(POSITION)).rejects.toThrow()
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_CONNECTION_GC_TIME_MS - 1)

    expect(result.current.isKoreaderSyncDisconnected()).toBe(true)

    await vi.advanceTimersByTimeAsync(1)

    expect(result.current.isKoreaderSyncDisconnected()).toBe(false)
  })
})
