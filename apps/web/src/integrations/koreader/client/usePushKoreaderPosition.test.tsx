import {
  type BookDocType,
  createBookDefaults,
  type KoreaderSyncConnectionDto,
  type KoreaderSyncPositionDto,
  ObokuErrorCode,
  ReadingStateState,
} from "@oboku/shared"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getOrCreateInstallationId } from "../../../common/browser"
import { CancelError } from "../../../errors/errors.shared"
import { HttpClientApiContext } from "../../../http"
import type { HttpApiClientWeb } from "../../../http/HttpClientApi.web"
import { HttpClientError } from "../../../http/httpClient.shared"
import { usePushKoreaderPosition } from "./usePushKoreaderPosition"
import { createKoreaderSyncConnectionQueryOptions } from "./useKoreaderSyncConnection"

const CONNECTION: KoreaderSyncConnectionDto = {
  serverUrl: "https://sync.example.com",
  username: "reader",
  connectedAt: "2026-01-01T00:00:00.000Z",
}

const KOREADER_DOCUMENT = "5d41402abc4b2a76b9719d911017c592"

const BOOK: BookDocType = {
  ...createBookDefaults(),
  _id: "book-1",
  _rev: "2-book",
  rx_model: "book",
  rxdbMeta: { lwt: 1 },
  readingStateCurrentState: ReadingStateState.Reading,
  readingStateCurrentBookmarkLocation: "epubcfi(/6/4!/4/2/1:0)",
  readingStateCurrentBookmarkLocationUpdatedAt: "2026-10-20T08:00:00.000Z",
  readingStateCurrentBookmarkProgressPercent: 0.42,
  readingStateCurrentBookmarkKoreaderProgress:
    "/body/DocFragment[3]/body/p[12]/text().0",
  readingStateCurrentBookmarkKoreaderDocument: KOREADER_DOCUMENT,
}

const BOOK_POSITION = {
  document: KOREADER_DOCUMENT,
  progress: "/body/DocFragment[3]/body/p[12]/text().0",
  percentage: 0.42,
  deviceId: getOrCreateInstallationId(),
}

const OTHER_DEVICE_POSITION: KoreaderSyncPositionDto = {
  progress: "/body/DocFragment[2]/body/p[1]/text().0",
  percentage: 0.3,
  device: "Kobo",
  deviceId: "kobo-device",
  updatedAt: "2026-10-20T07:00:00.000Z",
}

const KOREADER_SYNC_CONNECTION_GC_TIME_MS = 5 * 60 * 1000

type ConnectionAnswer = {
  data: { connection: KoreaderSyncConnectionDto | null }
}

type PositionAnswer = { data: { position: KoreaderSyncPositionDto | null } }

const createRefusal = ({ status, data }: { status: number; data: unknown }) =>
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
  createRefusal({ status: 400, data: { errors: [{ code }] } })

const createConnectionMissingError = () =>
  createRefusal({
    status: 404,
    data: {
      message: "No KOReader sync server connected",
      error: "Not Found",
      statusCode: 404,
    },
  })

const createPushHarness = ({
  connection = CONNECTION,
  serverPosition = null,
}: {
  connection?: KoreaderSyncConnectionDto | null
  serverPosition?: KoreaderSyncPositionDto | null
} = {}) => {
  const fetchConnection = vi.fn(
    async function answerConnection(): Promise<ConnectionAnswer> {
      return { data: { connection } }
    },
  )
  const pullPosition = vi.fn(async function answerPosition(
    _document: string | undefined,
    _signal: AbortSignal | undefined,
  ): Promise<PositionAnswer> {
    return { data: { position: serverPosition } }
  })
  const pushPosition = vi.fn(async function acceptPosition(
    _position: unknown,
    _signal: AbortSignal | undefined,
  ) {
    return { data: {} }
  })
  const sdkClient = {
    get: function answerGet(options: {
      url: string
      path?: { document: string }
      signal?: AbortSignal
    }) {
      return options.url === "/koreader-sync-connection"
        ? fetchConnection()
        : pullPosition(options.path?.document, options.signal)
    },
    put: function answerPut(options: { body: unknown; signal?: AbortSignal }) {
      return pushPosition(options.body, options.signal)
    },
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

  const openReader = () => {
    const { result } = renderHook(() => usePushKoreaderPosition(), { wrapper })

    return {
      push: (book = BOOK, signal = new AbortController().signal) =>
        result.current.mutateAsync({ book, signal }),
    }
  }

  const connectionQueryKey = createKoreaderSyncConnectionQueryOptions({
    httpClientApi: client,
    profileId: undefined,
  }).queryKey

  const getCachedConnection = () => queryClient.getQueryData(connectionQueryKey)

  const setCachedConnection = (connection: KoreaderSyncConnectionDto) =>
    queryClient.setQueryData(connectionQueryKey, { connection })

  return {
    fetchConnection,
    pullPosition,
    pushPosition,
    openReader,
    getCachedConnection,
    setCachedConnection,
  }
}

const renderPushKoreaderPosition = (
  options?: Parameters<typeof createPushHarness>[0],
) => {
  const harness = createPushHarness(options)

  return { ...harness, ...harness.openReader() }
}

describe("usePushKoreaderPosition", () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it("pushes the bookmark's position once the API says the account has a connection", async () => {
    vi.useFakeTimers()
    const connectionAnswerMs = 10_000
    const { push, fetchConnection, pushPosition } = renderPushKoreaderPosition()
    fetchConnection.mockImplementationOnce(function answerConnectionLate() {
      return new Promise(function resolveLater(resolve) {
        setTimeout(function answerConnected() {
          resolve({ data: { connection: CONNECTION } })
        }, connectionAnswerMs)
      })
    })

    const pushed = push()
    await vi.advanceTimersByTimeAsync(connectionAnswerMs - 1)

    expect(pushPosition).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    await pushed

    expect(pushPosition).toHaveBeenCalledExactlyOnceWith(
      BOOK_POSITION,
      expect.any(AbortSignal),
    )
  })

  it("does not push when the account has no connection", async () => {
    const { push, pullPosition, pushPosition } = renderPushKoreaderPosition({
      connection: null,
    })

    await push()

    expect(pullPosition).not.toHaveBeenCalled()
    expect(pushPosition).not.toHaveBeenCalled()
  })

  it("does not push a bookmark KOReader cannot open", async () => {
    const { push, fetchConnection, pullPosition, pushPosition } =
      renderPushKoreaderPosition()

    await push({ ...BOOK, readingStateCurrentBookmarkKoreaderProgress: null })

    expect(fetchConnection).not.toHaveBeenCalled()
    expect(pullPosition).not.toHaveBeenCalled()
    expect(pushPosition).not.toHaveBeenCalled()
  })

  it("asks the server for its position of the bookmark's file first", async () => {
    const { push, pullPosition, pushPosition } = renderPushKoreaderPosition()

    await push()

    expect(pullPosition).toHaveBeenCalledExactlyOnceWith(
      KOREADER_DOCUMENT,
      expect.any(AbortSignal),
    )
    expect(pullPosition).toHaveBeenCalledBefore(pushPosition)
  })

  it("pushes over a position another device left before the bookmark moved", async () => {
    const { push, pushPosition } = renderPushKoreaderPosition({
      serverPosition: OTHER_DEVICE_POSITION,
    })

    await push()

    expect(pushPosition).toHaveBeenCalledOnce()
  })

  it("does not push over a position another device left after the bookmark moved", async () => {
    const { push, pushPosition } = renderPushKoreaderPosition({
      serverPosition: {
        ...OTHER_DEVICE_POSITION,
        updatedAt: "2026-10-20T09:00:00.000Z",
      },
    })

    await push()

    expect(pushPosition).not.toHaveBeenCalled()
  })

  it("does not push the position the server already keeps", async () => {
    const { push, pushPosition } = renderPushKoreaderPosition({
      serverPosition: {
        ...OTHER_DEVICE_POSITION,
        progress: BOOK_POSITION.progress,
        updatedAt: "2026-10-20T07:00:00.000Z",
      },
    })

    await push()

    expect(pushPosition).not.toHaveBeenCalled()
  })

  it("pushes over a position this installation pushed, whenever the server received it", async () => {
    const { push, pushPosition } = renderPushKoreaderPosition({
      serverPosition: {
        ...OTHER_DEVICE_POSITION,
        deviceId: getOrCreateInstallationId(),
        updatedAt: "2026-10-20T09:00:00.000Z",
      },
    })

    await push()

    expect(pushPosition).toHaveBeenCalledOnce()
  })

  it("pushes over a position short of the bookmark, from a server that does not date its positions", async () => {
    const { push, pushPosition } = renderPushKoreaderPosition({
      serverPosition: {
        ...OTHER_DEVICE_POSITION,
        percentage: 0.3,
        updatedAt: null,
      },
    })

    await push()

    expect(pushPosition).toHaveBeenCalledOnce()
  })

  it("does not push over a position past the bookmark, from a server that does not date its positions", async () => {
    const { push, pushPosition } = renderPushKoreaderPosition({
      serverPosition: {
        ...OTHER_DEVICE_POSITION,
        percentage: 0.6,
        updatedAt: null,
      },
    })

    await push()

    expect(pushPosition).not.toHaveBeenCalled()
  })

  it("gives up as cancelled, without pushing, once abandoned while the server is asked for its position", async () => {
    const { push, pullPosition, pushPosition } = renderPushKoreaderPosition()
    pullPosition.mockImplementationOnce(
      function answerOnlyUntilAborted(_document, signal) {
        return new Promise(function rejectOnAbort(_resolve, reject) {
          signal?.addEventListener(
            "abort",
            function rejectAbortedPull() {
              reject(signal.reason)
            },
            { once: true },
          )
        })
      },
    )
    const abandonPush = new AbortController()

    const pushed = push(BOOK, abandonPush.signal)
    await vi.waitFor(function expectPullAsked() {
      expect(pullPosition).toHaveBeenCalledOnce()
    })
    abandonPush.abort()

    await expect(pushed).rejects.toBeInstanceOf(CancelError)
    expect(pushPosition).not.toHaveBeenCalled()
  })

  it("asks for the connection once, then takes it from the cache for a few minutes", async () => {
    vi.useFakeTimers()
    const { push, fetchConnection, pushPosition } = renderPushKoreaderPosition()

    await push()
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_CONNECTION_GC_TIME_MS - 1)
    await push()

    expect(fetchConnection).toHaveBeenCalledOnce()
    expect(pushPosition).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(1)
    await push()

    expect(fetchConnection).toHaveBeenCalledTimes(2)
  })

  it("sends pushes one after another, in the order they were made", async () => {
    vi.useFakeTimers()
    const slowAnswerMs = 1000
    const { pushPosition, openReader } = createPushHarness()
    pushPosition.mockImplementationOnce(function answerSlowly() {
      return new Promise(function resolveLater(resolve) {
        setTimeout(function answered() {
          resolve({ data: {} })
        }, slowAnswerMs)
      })
    })
    const earlierBook = {
      ...BOOK,
      readingStateCurrentBookmarkProgressPercent: 0.4,
    }
    const laterBook = {
      ...BOOK,
      readingStateCurrentBookmarkProgressPercent: 0.5,
    }

    const pushed = Promise.all([
      openReader().push(earlierBook),
      openReader().push(laterBook),
    ])
    await vi.advanceTimersByTimeAsync(slowAnswerMs - 1)

    expect(pushPosition).toHaveBeenCalledExactlyOnceWith(
      { ...BOOK_POSITION, percentage: 0.4 },
      expect.any(AbortSignal),
    )

    await vi.advanceTimersByTimeAsync(1)
    await pushed

    expect(pushPosition).toHaveBeenLastCalledWith(
      { ...BOOK_POSITION, percentage: 0.5 },
      expect.any(AbortSignal),
    )
  })

  it("does not push, and asks the API for the connection again, once the server says the connection is gone", async () => {
    const {
      fetchConnection,
      pullPosition,
      pushPosition,
      openReader,
      getCachedConnection,
    } = createPushHarness()
    const { push } = openReader()
    fetchConnection
      .mockResolvedValueOnce({ data: { connection: CONNECTION } })
      .mockResolvedValue({ data: { connection: null } })
    pullPosition.mockRejectedValueOnce(createConnectionMissingError())

    await expect(push()).rejects.toThrow()

    expect(pushPosition).not.toHaveBeenCalled()
    expect(getCachedConnection()).toEqual({ connection: null })

    await push()

    expect(fetchConnection).toHaveBeenCalledTimes(2)
    expect(pullPosition).toHaveBeenCalledOnce()
    expect(pushPosition).not.toHaveBeenCalled()
  })

  it("asks the API for the connection again after a push refused because it is gone", async () => {
    const { fetchConnection, pushPosition, openReader, getCachedConnection } =
      createPushHarness()
    const { push } = openReader()
    fetchConnection
      .mockResolvedValueOnce({ data: { connection: CONNECTION } })
      .mockResolvedValue({ data: { connection: null } })
    pushPosition.mockRejectedValueOnce(createConnectionMissingError())

    await expect(push()).rejects.toThrow()

    expect(getCachedConnection()).toEqual({ connection: null })

    await push()

    expect(fetchConnection).toHaveBeenCalledTimes(2)
    expect(pushPosition).toHaveBeenCalledOnce()
  })

  it("stops asking and pushing once the server refuses the key, keeping the connection", async () => {
    const { pullPosition, pushPosition, openReader, getCachedConnection } =
      createPushHarness()
    const { push } = openReader()
    pullPosition.mockRejectedValueOnce(
      createApiError(ObokuErrorCode.ERROR_KOREADER_SYNC_SERVER_UNAUTHORIZED),
    )

    await expect(push()).rejects.toThrow()
    await push()

    expect(pullPosition).toHaveBeenCalledOnce()
    expect(pushPosition).not.toHaveBeenCalled()
    expect(getCachedConnection()).toEqual({ connection: CONNECTION })
  })

  it("pushes again once the account connects again after the server refused the key", async () => {
    const { pullPosition, pushPosition, openReader, setCachedConnection } =
      createPushHarness()
    const { push } = openReader()
    pullPosition.mockRejectedValueOnce(
      createApiError(ObokuErrorCode.ERROR_KOREADER_SYNC_SERVER_UNAUTHORIZED),
    )

    await expect(push()).rejects.toThrow()
    setCachedConnection({
      ...CONNECTION,
      connectedAt: "2026-02-01T00:00:00.000Z",
    })
    await push()

    expect(pushPosition).toHaveBeenCalledOnce()
  })

  it("keeps pushing after a push fails for another reason", async () => {
    const { push, pushPosition } = renderPushKoreaderPosition()
    pushPosition.mockRejectedValueOnce(
      createApiError(ObokuErrorCode.ERROR_KOREADER_SYNC_SERVER_UNREACHABLE),
    )

    await expect(push()).rejects.toThrow()
    await push()

    expect(pushPosition).toHaveBeenCalledTimes(2)
  })
})
