import {
  type BookKoreaderSyncPosition,
  type KoreaderSyncConnectionDto,
  type KoreaderSyncPositionDto,
  ObokuErrorCode,
} from "@oboku/shared"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, cleanup, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { from } from "rxjs"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

type FakeBookData = {
  readingStateKoreaderSyncPosition: BookKoreaderSyncPosition | null
}

const mocks = vi.hoisted(function createKoreaderPositionCheckMocks() {
  return {
    isDebugEnabled: vi.fn(() => true),
    readSavedPosition: vi.fn((): BookKoreaderSyncPosition | null => null),
    savePosition: vi.fn(async function saveOnFakeBook(
      _position: BookKoreaderSyncPosition | null,
    ) {}),
  }
})

vi.mock("../../auth/useIsAuthenticated", function mockIsAuthenticated() {
  return { useIsAuthenticated: () => true }
})

vi.mock("../../debug/isDebugEnabled.shared", function mockDebugMode() {
  return { isDebugEnabled: mocks.isDebugEnabled }
})

vi.mock(
  "../../books/incrementalBookMutation",
  function mockIncrementalBookMutation() {
    return {
      incrementalBookMutation: function applyToFakeBook(
        _bookId: string,
        applyIncremental: (book: unknown) => Promise<unknown>,
      ) {
        const readBook = (): FakeBookData => ({
          readingStateKoreaderSyncPosition: mocks.readSavedPosition(),
        })
        const book = {
          toJSON: readBook,
          incrementalModify: async function modifyFakeBook(
            modify: (old: FakeBookData) => FakeBookData,
          ) {
            await mocks.savePosition(
              modify(readBook()).readingStateKoreaderSyncPosition,
            )

            return book
          },
        }

        return from(applyIncremental(book))
      },
    }
  },
)

import { HttpClientApiContext } from "../../http"
import type { HttpApiClientWeb } from "../../http/HttpClientApi.web"
import { HttpClientError } from "../../http/httpClient.shared"
import { useKoreaderPositionCheck } from "./useKoreaderPositionCheck"

const BOOK_ID = "book-1"
const KOREADER_DOCUMENT = "8f3a9c1e0b7d4f2a6c5e1d0b9a8f7e6d"
const KOREADER_POSITION_CHECK_DEADLINE_MS = 15_000

const CONNECTION: KoreaderSyncConnectionDto = {
  serverUrl: "https://sync.example.com",
  username: "reader",
  connectedAt: "2026-01-01T00:00:00.000Z",
}

const SERVER_POSITION_DTO: KoreaderSyncPositionDto = {
  progress: "/body/DocFragment[9]/body/p[12]/text().4",
  percentage: 0.6,
  device: "Kobo",
  deviceId: "kobo-device",
  updatedAt: "2026-10-20T09:00:00.000Z",
}

const SERVER_POSITION: BookKoreaderSyncPosition = {
  document: KOREADER_DOCUMENT,
  ...SERVER_POSITION_DTO,
}

const createRefusal = ({ status, data }: { status: number; data: unknown }) =>
  new HttpClientError(
    {
      response: new Response(),
      data,
      status,
      statusText: "",
      headers: {},
      config: {
        input: `https://api.example.com/koreader-sync-connection/progress/${KOREADER_DOCUMENT}`,
      },
    },
    undefined,
  )

const createApiError = (code: ObokuErrorCode) =>
  createRefusal({ status: 400, data: { errors: [{ code }] } })

const createCheckHarness = ({
  connection = CONNECTION,
}: {
  connection?: KoreaderSyncConnectionDto | null
} = {}) => {
  const fetchConnection = vi.fn(async function answerConnection() {
    return { data: { connection } }
  })
  const pullPosition = vi.fn(async function answerPosition(
    _document: string | undefined,
  ): Promise<{ data: { position: KoreaderSyncPositionDto | null } }> {
    return { data: { position: SERVER_POSITION_DTO } }
  })
  const sdkClient = {
    get: function answerGet(options: {
      url: string
      path?: { document: string }
    }) {
      return options.url === "/koreader-sync-connection"
        ? fetchConnection()
        : pullPosition(options.path?.document)
    },
  }
  // test double: the check only calls the generated client's `get`
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

  const openBook = ({ enabled = true }: { enabled?: boolean } = {}) =>
    renderHook(
      function renderKoreaderPositionCheck() {
        return useKoreaderPositionCheck({
          bookId: BOOK_ID,
          koreaderDocument: KOREADER_DOCUMENT,
          enabled,
        })
      },
      { wrapper },
    )

  return { openBook, fetchConnection, pullPosition }
}

const holdNextSave = () => {
  const heldSave = Promise.withResolvers<void>()

  mocks.savePosition.mockImplementationOnce(function saveLater() {
    return heldSave.promise
  })

  return heldSave.resolve
}

const holdNextPull = (
  pullPosition: ReturnType<typeof createCheckHarness>["pullPosition"],
) => {
  const heldPull = Promise.withResolvers<{
    data: { position: KoreaderSyncPositionDto | null }
  }>()

  pullPosition.mockImplementationOnce(function answerLater() {
    return heldPull.promise
  })

  return function answerPull() {
    heldPull.resolve({ data: { position: SERVER_POSITION_DTO } })
  }
}

const deliverQueryUpdateScheduledDuringTick = () =>
  vi.advanceTimersByTimeAsync(1)

const setOnLine = (onLine: boolean) => {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(onLine)
}

describe("useKoreaderPositionCheck", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setOnLine(true)
    mocks.isDebugEnabled.mockReset().mockReturnValue(true)
    mocks.readSavedPosition.mockReset().mockReturnValue(null)
    mocks.savePosition.mockReset()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it("asks the server where the book's file was left and lets the book open there once saved on the book", async () => {
    const { openBook, pullPosition } = createCheckHarness()
    const answerSave = holdNextSave()
    const { result } = openBook()

    await vi.advanceTimersByTimeAsync(0)

    expect(pullPosition).toHaveBeenCalledExactlyOnceWith(KOREADER_DOCUMENT)
    expect(mocks.savePosition).toHaveBeenCalledExactlyOnceWith(SERVER_POSITION)
    expect(result.current.status).toBe("checking")

    answerSave()
    await vi.advanceTimersByTimeAsync(0)

    expect(result.current).toEqual({
      status: "done",
      pulledPosition: SERVER_POSITION,
    })
  })

  it("leaves the book as it is when it already holds the server's position", async () => {
    mocks.readSavedPosition.mockReturnValue(SERVER_POSITION)
    const { openBook } = createCheckHarness()
    const { result } = openBook()

    await vi.advanceTimersByTimeAsync(0)

    expect(result.current).toEqual({
      status: "done",
      pulledPosition: SERVER_POSITION,
    })
    expect(mocks.savePosition).not.toHaveBeenCalled()
  })

  it("saves that the server keeps no position for the book's file", async () => {
    mocks.readSavedPosition.mockReturnValue(SERVER_POSITION)
    const { openBook, pullPosition } = createCheckHarness()
    pullPosition.mockResolvedValueOnce({ data: { position: null } })
    const { result } = openBook()

    await vi.advanceTimersByTimeAsync(0)

    expect(mocks.savePosition).toHaveBeenCalledExactlyOnceWith(null)
    expect(result.current).toEqual({ status: "done", pulledPosition: null })
  })

  it("lets the book open without asking a server when the account has none", async () => {
    const { openBook, pullPosition } = createCheckHarness({ connection: null })
    const { result } = openBook()

    await vi.advanceTimersByTimeAsync(0)

    expect(pullPosition).not.toHaveBeenCalled()
    expect(result.current).toEqual({ status: "done", pulledPosition: null })
  })

  it("asks the API for the connection again when the server's position is gone with it", async () => {
    const { openBook, fetchConnection, pullPosition } = createCheckHarness()
    pullPosition.mockRejectedValueOnce(
      createRefusal({
        status: 404,
        data: {
          message: "No KOReader sync server connected",
          error: "Not Found",
          statusCode: 404,
        },
      }),
    )
    const { result } = openBook()

    await vi.advanceTimersByTimeAsync(0)

    expect(result.current).toEqual({ status: "done", pulledPosition: null })
    expect(fetchConnection).toHaveBeenCalledTimes(2)
  })

  it.each([
    ["offline", () => setOnLine(false)],
    ["outside debug mode", () => mocks.isDebugEnabled.mockReturnValue(false)],
  ])("lets the book open right away without asking %s", async (_, setUp) => {
    setUp()
    const { openBook, fetchConnection } = createCheckHarness()
    const { result } = openBook()

    expect(result.current).toEqual({ status: "done" })

    await vi.advanceTimersByTimeAsync(0)

    expect(fetchConnection).not.toHaveBeenCalled()
  })

  it("lets a preview open right away without asking", async () => {
    const { openBook, fetchConnection } = createCheckHarness()
    const { result } = openBook({ enabled: false })

    expect(result.current).toEqual({ status: "done" })

    await vi.advanceTimersByTimeAsync(0)

    expect(fetchConnection).not.toHaveBeenCalled()
  })

  it("says the server refused the password, and lets the book open once the user continues", async () => {
    const { openBook, pullPosition } = createCheckHarness()
    pullPosition.mockRejectedValueOnce(
      createApiError(ObokuErrorCode.ERROR_KOREADER_SYNC_SERVER_UNAUTHORIZED),
    )
    const { result } = openBook()

    await vi.advanceTimersByTimeAsync(0)

    expect(result.current.status).toBe("refused")

    act(function continueWithoutKoreaderPosition() {
      if (result.current.status !== "refused") return

      result.current.continueAnyway()
    })

    expect(result.current).toEqual({ status: "done" })
  })

  it("says the check failed, and asks again when the user tries again", async () => {
    const { openBook, pullPosition } = createCheckHarness()
    pullPosition.mockRejectedValueOnce(
      createApiError(ObokuErrorCode.ERROR_KOREADER_SYNC_SERVER_UNREACHABLE),
    )
    const answerSecondPull = holdNextPull(pullPosition)
    const { result } = openBook()

    await vi.advanceTimersByTimeAsync(0)

    expect(result.current.status).toBe("failed")

    act(function pullKoreaderPositionAgain() {
      if (result.current.status !== "failed") return

      result.current.tryAgain()
    })
    await vi.advanceTimersByTimeAsync(0)

    expect(result.current.status).toBe("checking")

    answerSecondPull()
    await vi.advanceTimersByTimeAsync(0)

    expect(pullPosition).toHaveBeenCalledTimes(2)
    expect(result.current).toEqual({
      status: "done",
      pulledPosition: SERVER_POSITION,
    })
  })

  it("gives up asking after fifteen seconds without an answer", async () => {
    const { openBook, pullPosition } = createCheckHarness()
    holdNextPull(pullPosition)
    const { result } = openBook()

    await vi.advanceTimersByTimeAsync(KOREADER_POSITION_CHECK_DEADLINE_MS - 1)

    expect(result.current.status).toBe("checking")

    await vi.advanceTimersByTimeAsync(1)
    await deliverQueryUpdateScheduledDuringTick()

    expect(result.current.status).toBe("failed")
  })

  it("lets the book open once the user continues while asking, and saves the answer that comes later", async () => {
    const { openBook, pullPosition } = createCheckHarness()
    const answerPull = holdNextPull(pullPosition)
    const { result } = openBook()

    await vi.advanceTimersByTimeAsync(0)

    act(function continueWithoutKoreaderPosition() {
      if (result.current.status !== "checking") return

      result.current.continueAnyway()
    })

    expect(result.current).toEqual({ status: "done" })

    answerPull()
    await vi.advanceTimersByTimeAsync(0)

    expect(result.current).toEqual({ status: "done" })
    expect(mocks.savePosition).toHaveBeenCalledExactlyOnceWith(SERVER_POSITION)
  })
})
