import { type KoreaderSyncConnectionDto, ObokuErrorCode } from "@oboku/shared"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { HttpClientApiContext } from "../../http"
import type { HttpApiClientWeb } from "../../http/HttpClientApi.web"
import { HttpClientError } from "../../http/httpClient.shared"
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

const createPushRefusal = ({
  status,
  data,
}: {
  status: number
  data: unknown
}) =>
  new HttpClientError(
    {
      response: new Response(),
      data,
      status,
      statusText: "",
      headers: {},
      config: {
        input: "https://api.example.com/koreader-sync-connection/progress",
      },
    },
    undefined,
  )

const createApiError = (code: ObokuErrorCode) =>
  createPushRefusal({ status: 400, data: { errors: [{ code }] } })

const renderPushKoreaderPosition = ({
  connection = CONNECTION,
}: {
  connection?: KoreaderSyncConnectionDto | null
} = {}) => {
  const sdkClient = {
    get: vi.fn().mockResolvedValue({ data: { connection } }),
    put: vi.fn().mockResolvedValue({ data: {} }),
  }
  // test double: the push only calls the generated client's `get` and `put`
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

  const { result } = renderHook(() => usePushKoreaderPosition(), { wrapper })

  return {
    push: () => result.current.mutateAsync(POSITION),
    sdkClient,
  }
}

describe("usePushKoreaderPosition", () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it("pushes the position once the API says the account has a connection", async () => {
    vi.useFakeTimers()
    const connectionAnswerMs = 10_000
    const { push, sdkClient } = renderPushKoreaderPosition()
    sdkClient.get.mockImplementationOnce(function answerConnectionLate() {
      return new Promise(function resolveLater(resolve) {
        setTimeout(function answerConnected() {
          resolve({ data: { connection: CONNECTION } })
        }, connectionAnswerMs)
      })
    })

    const pushed = push()
    await vi.advanceTimersByTimeAsync(connectionAnswerMs - 1)

    expect(sdkClient.put).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    await pushed

    expect(sdkClient.put).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ body: POSITION }),
    )
  })

  it("does not push when the account has no connection", async () => {
    const { push, sdkClient } = renderPushKoreaderPosition({ connection: null })

    await push()

    expect(sdkClient.put).not.toHaveBeenCalled()
  })

  it("asks for the connection once, then takes it from the cache for a few minutes", async () => {
    vi.useFakeTimers()
    const { push, sdkClient } = renderPushKoreaderPosition()

    await push()
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_CONNECTION_GC_TIME_MS - 1)
    await push()

    expect(sdkClient.get).toHaveBeenCalledOnce()
    expect(sdkClient.put).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(1)
    await push()

    expect(sdkClient.get).toHaveBeenCalledTimes(2)
  })

  it.each([
    {
      refusal: "no connection",
      createRefusal: () =>
        createPushRefusal({
          status: 404,
          data: {
            message: "No KOReader sync server connected",
            error: "Not Found",
            statusCode: 404,
          },
        }),
    },
    {
      refusal: "a key the server no longer accepts",
      createRefusal: () =>
        createApiError(ObokuErrorCode.ERROR_KOREADER_SYNC_SERVER_UNAUTHORIZED),
    },
  ])(
    "stops pushing after a push refused for $refusal",
    async ({ createRefusal }) => {
      const { push, sdkClient } = renderPushKoreaderPosition()
      sdkClient.put.mockRejectedValueOnce(createRefusal())

      await expect(push()).rejects.toThrow()
      await push()

      expect(sdkClient.put).toHaveBeenCalledOnce()
      expect(sdkClient.get).toHaveBeenCalledOnce()
    },
  )

  it("keeps pushing after a push fails for another reason", async () => {
    const { push, sdkClient } = renderPushKoreaderPosition()
    sdkClient.put.mockRejectedValueOnce(
      createApiError(ObokuErrorCode.ERROR_KOREADER_SYNC_SERVER_UNREACHABLE),
    )

    await expect(push()).rejects.toThrow()
    await push()

    expect(sdkClient.put).toHaveBeenCalledTimes(2)
  })
})
