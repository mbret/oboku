import {
  type BookDocType,
  createBookDefaults,
  emptyBookmark,
  type KoreaderSyncConnectionDto,
  type KoreaderSyncPositionDto,
  ObokuErrorCode,
  ReadingStateState,
} from "@oboku/shared"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, cleanup, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

type StoredBookDocument = {
  toJSON: () => BookDocType
  incrementalModify: (
    modify: (old: BookDocType) => BookDocType,
  ) => Promise<StoredBookDocument>
}

const mocks = vi.hoisted(function createKoreaderPositionCheckMocks() {
  const state: { book?: BookDocType } = {}

  const saveBook = vi.fn(async function saveStoredBook(book: BookDocType) {
    state.book = book

    return book
  })

  const replicateBeforeWrite = vi.fn(function replicateNothing() {})

  const toStoredDocument = (storedBook: BookDocType): StoredBookDocument => ({
    toJSON: function toStoredBook() {
      return storedBook
    },
    incrementalModify: async function modifyLatestStoredBook(modify) {
      replicateBeforeWrite()

      if (!state.book) throw new Error("No book stored")

      return toStoredDocument(await saveBook(modify(state.book)))
    },
  })

  return {
    state,
    saveBook,
    replicateBeforeWrite,
    toStoredDocument,
  }
})

vi.mock("../../../auth/useIsAuthenticated", function mockIsAuthenticated() {
  return { useIsAuthenticated: () => true }
})

vi.mock(
  "../../../books/incrementalBookMutation",
  async function mockIncrementalBookMutation() {
    const { defer } = await import("rxjs")

    return {
      incrementalBookMutation: function mutateStoredBook(
        _bookId: string,
        applyIncremental: (document: StoredBookDocument) => Promise<unknown>,
      ) {
        return defer(function applyToStoredBook() {
          if (!mocks.state.book) throw new Error("No book stored")

          return applyIncremental(mocks.toStoredDocument(mocks.state.book))
        })
      },
    }
  },
)

import { getOrCreateInstallationId } from "../../../common/browser"
import { HttpClientApiContext } from "../../../http"
import type { HttpApiClientWeb } from "../../../http/HttpClientApi.web"
import { HttpClientError } from "../../../http/httpClient.shared"
import {
  clearActiveProfileId,
  setActiveProfileId,
} from "../../../profiles/active/activeProfileId"
import {
  type KoreaderPositionCheck,
  useKoreaderPositionCheck,
} from "./useKoreaderPositionCheck"

const BOOK_ID = "book-1"
const KOREADER_DOCUMENT = "8f3a9c1e0b7d4f2a6c5e1d0b9a8f7e6d"
const KOREADER_POSITION_CHECK_DEADLINE_MS = 15_000
const BOOKMARK_KOREADER_PROGRESS = "/body/DocFragment[3]/body/p[2]/text().0"

const CONNECTION: KoreaderSyncConnectionDto = {
  serverUrl: "https://sync.example.com",
  username: "reader",
  connectedAt: "2026-01-01T00:00:00.000Z",
}

const STORED_BOOK: BookDocType = {
  ...createBookDefaults(),
  _id: BOOK_ID,
  _rev: "2-book",
  rx_model: "book",
  rxdbMeta: { lwt: 1 },
  readingStateCurrentState: ReadingStateState.Reading,
  readingStateCurrentBookmarkLocation: "epubcfi(/6/4!/4/2/1:0)",
  readingStateCurrentBookmarkLocationUpdatedAt: "2026-10-20T08:00:00.000Z",
  readingStateCurrentBookmarkProgressPercent: 0.2,
  readingStateCurrentBookmarkKoreaderProgress: BOOKMARK_KOREADER_PROGRESS,
  readingStateCurrentBookmarkKoreaderDocument: KOREADER_DOCUMENT,
}

const NEWER_SERVER_POSITION: KoreaderSyncPositionDto = {
  progress: "/body/DocFragment[9]/body/p[12]/text().4",
  percentage: 0.6,
  device: "Kobo",
  deviceId: "kobo-device",
  updatedAt: "2026-10-20T09:00:00.000Z",
}

const BOOK_AT_NEWER_SERVER_POSITION: BookDocType = {
  ...STORED_BOOK,
  readingStateCurrentBookmarkLocation: null,
  readingStateCurrentBookmarkProgressPercent: NEWER_SERVER_POSITION.percentage,
  readingStateCurrentBookmarkKoreaderProgress: NEWER_SERVER_POSITION.progress,
  readingStateCurrentBookmarkKoreaderDocument: KOREADER_DOCUMENT,
  readingStateCurrentBookmarkLocationUpdatedAt: NEWER_SERVER_POSITION.updatedAt,
}

type PositionAnswer = { data: { position: KoreaderSyncPositionDto | null } }

type ConnectionAnswer = {
  data: { connection: KoreaderSyncConnectionDto | null }
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
  const fetchConnection = vi.fn(
    async function answerConnection(): Promise<ConnectionAnswer> {
      return { data: { connection } }
    },
  )
  const pullPosition = vi.fn(async function answerPosition(
    _document: string | undefined,
    _signal: AbortSignal | undefined,
  ): Promise<PositionAnswer> {
    return { data: { position: NEWER_SERVER_POSITION } }
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

  const renderStatus =
    vi.fn<(status: KoreaderPositionCheck["status"]) => void>()

  const openBook = ({ enabled = true }: { enabled?: boolean } = {}) =>
    renderHook(
      function renderKoreaderPositionCheck() {
        const check = useKoreaderPositionCheck({
          bookId: BOOK_ID,
          koreaderDocument: KOREADER_DOCUMENT,
          enabled,
        })

        renderStatus(check.status)

        return check
      },
      { wrapper },
    )

  const getRenderedStatuses = () =>
    new Set(renderStatus.mock.calls.map(([status]) => status))

  return { openBook, fetchConnection, pullPosition, getRenderedStatuses }
}

type Harness = ReturnType<typeof createCheckHarness>

const holdNextPull = (pullPosition: Harness["pullPosition"]) => {
  const heldPull = Promise.withResolvers<PositionAnswer>()

  pullPosition.mockImplementationOnce(
    function answerLaterUnlessAborted(_document, signal) {
      signal?.addEventListener(
        "abort",
        function rejectAbortedPull() {
          heldPull.reject(signal.reason)
        },
        { once: true },
      )

      return heldPull.promise
    },
  )

  return function answerPull() {
    heldPull.resolve({ data: { position: NEWER_SERVER_POSITION } })
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
    setActiveProfileId("profile")
    mocks.saveBook.mockClear()
    mocks.replicateBeforeWrite.mockReset()
    mocks.state.book = STORED_BOOK
  })

  afterEach(() => {
    cleanup()
    clearActiveProfileId()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it("takes the position another device left after the bookmark moved as the bookmark, then lets the book open", async () => {
    const { openBook, pullPosition } = createCheckHarness()
    const answerPull = holdNextPull(pullPosition)
    const { result } = openBook()

    await vi.advanceTimersByTimeAsync(0)

    expect(pullPosition).toHaveBeenCalledExactlyOnceWith(
      KOREADER_DOCUMENT,
      expect.any(AbortSignal),
    )
    expect(result.current.status).toBe("checking")

    answerPull()
    await vi.advanceTimersByTimeAsync(0)

    expect(mocks.saveBook).toHaveBeenCalledExactlyOnceWith(
      BOOK_AT_NEWER_SERVER_POSITION,
    )
    expect(result.current).toEqual({ status: "done" })
  })

  it("asks the server again each time the book opens", async () => {
    const { openBook, pullPosition } = createCheckHarness()
    const { unmount } = openBook()
    await vi.advanceTimersByTimeAsync(0)
    unmount()
    await vi.advanceTimersByTimeAsync(0)

    const { result } = openBook()
    await vi.advanceTimersByTimeAsync(0)

    expect(pullPosition).toHaveBeenCalledTimes(2)
    expect(mocks.saveBook).toHaveBeenCalledOnce()
    expect(result.current).toEqual({ status: "done" })
  })

  it("lets the book open only once its new bookmark is saved", async () => {
    const heldSave = Promise.withResolvers<void>()
    mocks.saveBook.mockImplementationOnce(async function saveLater(book) {
      await heldSave.promise

      return book
    })
    const { openBook } = createCheckHarness()
    const { result } = openBook()

    await vi.advanceTimersByTimeAsync(0)

    expect(mocks.saveBook).toHaveBeenCalledOnce()
    expect(result.current.status).toBe("checking")

    heldSave.resolve()
    await vi.advanceTimersByTimeAsync(0)

    expect(result.current.status).toBe("done")
  })

  it("keeps the bookmark when it moved after the server received its position", async () => {
    const { openBook, pullPosition } = createCheckHarness()
    pullPosition.mockResolvedValueOnce({
      data: {
        position: {
          ...NEWER_SERVER_POSITION,
          updatedAt: "2026-10-20T07:00:00.000Z",
        },
      },
    })
    const { result } = openBook()

    await vi.advanceTimersByTimeAsync(0)

    expect(mocks.saveBook).not.toHaveBeenCalled()
    expect(result.current).toEqual({ status: "done" })
  })

  it("keeps a bookmark that moved between the check and the write", async () => {
    const bookMovedMeanwhile: BookDocType = {
      ...STORED_BOOK,
      _rev: "3-book",
      readingStateCurrentBookmarkLocation: "epubcfi(/6/8!/4/2/1:0)",
      readingStateCurrentBookmarkLocationUpdatedAt: "2026-10-20T09:30:00.000Z",
      readingStateCurrentBookmarkProgressPercent: 0.7,
    }
    mocks.replicateBeforeWrite.mockImplementationOnce(
      function replicateNewerBookmark() {
        mocks.state.book = bookMovedMeanwhile
      },
    )
    const { openBook } = createCheckHarness()
    const { result } = openBook()

    await vi.advanceTimersByTimeAsync(0)

    expect(mocks.saveBook).toHaveBeenCalledExactlyOnceWith(bookMovedMeanwhile)
    expect(result.current).toEqual({ status: "done" })
  })

  it("dates the bookmark when it was taken, from a server that does not say when it received the position", async () => {
    const takenAt = "2026-10-20T10:00:00.000Z"
    vi.setSystemTime(new Date(takenAt))
    const { openBook, pullPosition } = createCheckHarness()
    pullPosition.mockResolvedValueOnce({
      data: { position: { ...NEWER_SERVER_POSITION, updatedAt: null } },
    })
    openBook()

    await vi.advanceTimersByTimeAsync(0)

    expect(mocks.saveBook).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        readingStateCurrentBookmarkKoreaderProgress:
          NEWER_SERVER_POSITION.progress,
        readingStateCurrentBookmarkLocationUpdatedAt: takenAt,
      }),
    )
  })

  it("keeps the bookmark when a server that does not date its positions has one short of it", async () => {
    const { openBook, pullPosition } = createCheckHarness()
    pullPosition.mockResolvedValueOnce({
      data: {
        position: {
          ...NEWER_SERVER_POSITION,
          updatedAt: null,
          percentage: 0.1,
        },
      },
    })
    openBook()

    await vi.advanceTimersByTimeAsync(0)

    expect(mocks.saveBook).not.toHaveBeenCalled()
  })

  it("keeps the bookmark when this installation pushed the server's position", async () => {
    const { openBook, pullPosition } = createCheckHarness()
    pullPosition.mockResolvedValueOnce({
      data: {
        position: {
          ...NEWER_SERVER_POSITION,
          deviceId: getOrCreateInstallationId(),
        },
      },
    })
    openBook()

    await vi.advanceTimersByTimeAsync(0)

    expect(mocks.saveBook).not.toHaveBeenCalled()
  })

  it("keeps the bookmark when the server's position is its own place in the opened file", async () => {
    const { openBook, pullPosition } = createCheckHarness()
    pullPosition.mockResolvedValueOnce({
      data: {
        position: {
          ...NEWER_SERVER_POSITION,
          progress: BOOKMARK_KOREADER_PROGRESS,
        },
      },
    })
    openBook()

    await vi.advanceTimersByTimeAsync(0)

    expect(mocks.saveBook).not.toHaveBeenCalled()
  })

  it("takes a newer position at the bookmark's place when that place is in another file", async () => {
    mocks.state.book = {
      ...STORED_BOOK,
      readingStateCurrentBookmarkKoreaderDocument: "document-of-another-file",
    }
    const { openBook, pullPosition } = createCheckHarness()
    pullPosition.mockResolvedValueOnce({
      data: {
        position: {
          ...NEWER_SERVER_POSITION,
          progress: BOOKMARK_KOREADER_PROGRESS,
        },
      },
    })
    openBook()

    await vi.advanceTimersByTimeAsync(0)

    expect(mocks.saveBook).toHaveBeenCalledOnce()
  })

  it("takes the server's position over a bookmark that was never dated, and for a book without a bookmark", async () => {
    const olderServerPosition = {
      ...NEWER_SERVER_POSITION,
      updatedAt: "2026-10-20T07:00:00.000Z",
    }
    const { openBook, pullPosition } = createCheckHarness()
    pullPosition.mockResolvedValue({ data: { position: olderServerPosition } })

    mocks.state.book = {
      ...STORED_BOOK,
      readingStateCurrentBookmarkLocationUpdatedAt: null,
    }
    const { unmount } = openBook()
    await vi.advanceTimersByTimeAsync(0)
    unmount()
    await vi.advanceTimersByTimeAsync(0)

    mocks.state.book = {
      ...STORED_BOOK,
      ...emptyBookmark,
      readingStateCurrentBookmarkLocationUpdatedAt: null,
    }
    openBook()
    await vi.advanceTimersByTimeAsync(0)

    expect(mocks.saveBook).toHaveBeenCalledTimes(2)
  })

  it("keeps the bookmark when the server keeps no position", async () => {
    const { openBook, pullPosition } = createCheckHarness()
    pullPosition.mockResolvedValueOnce({ data: { position: null } })
    const { result } = openBook()

    await vi.advanceTimersByTimeAsync(0)

    expect(mocks.saveBook).not.toHaveBeenCalled()
    expect(result.current).toEqual({ status: "done" })
  })

  it("lets the book open without asking a server or mentioning KOReader when the account has none", async () => {
    const { openBook, pullPosition, getRenderedStatuses } = createCheckHarness({
      connection: null,
    })
    const { result } = openBook()

    await vi.advanceTimersByTimeAsync(0)

    expect(pullPosition).not.toHaveBeenCalled()
    expect(result.current).toEqual({ status: "done" })
    expect(getRenderedStatuses()).toEqual(new Set(["starting", "done"]))
  })

  it("waits for the connection lookup still out without mentioning KOReader, then asks the server", async () => {
    const { openBook, fetchConnection, pullPosition } = createCheckHarness()
    const heldConnection = Promise.withResolvers<ConnectionAnswer>()
    fetchConnection.mockReturnValueOnce(heldConnection.promise)
    const answerPull = holdNextPull(pullPosition)
    const { result } = openBook()

    await vi.advanceTimersByTimeAsync(0)

    expect(result.current).toEqual({ status: "starting" })
    expect(pullPosition).not.toHaveBeenCalled()

    heldConnection.resolve({ data: { connection: CONNECTION } })
    await vi.advanceTimersByTimeAsync(0)

    expect(result.current.status).toBe("checking")

    answerPull()
    await vi.advanceTimersByTimeAsync(0)

    expect(result.current).toEqual({ status: "done" })
  })

  it("lets the book open without mentioning KOReader when the connection lookup fails", async () => {
    const { openBook, fetchConnection, pullPosition, getRenderedStatuses } =
      createCheckHarness()
    fetchConnection.mockRejectedValue(new Error("API unreachable"))
    const { result } = openBook()

    await vi.advanceTimersByTimeAsync(KOREADER_POSITION_CHECK_DEADLINE_MS)

    expect(result.current).toEqual({ status: "done" })
    expect(pullPosition).not.toHaveBeenCalled()
    expect(getRenderedStatuses()).toEqual(new Set(["starting", "done"]))
  })

  it("lets the book open without mentioning KOReader when the connection lookup takes more than fifteen seconds", async () => {
    const { openBook, fetchConnection, pullPosition } = createCheckHarness()
    fetchConnection.mockReturnValueOnce(
      Promise.withResolvers<ConnectionAnswer>().promise,
    )
    const { result } = openBook()

    await vi.advanceTimersByTimeAsync(KOREADER_POSITION_CHECK_DEADLINE_MS - 1)

    expect(result.current).toEqual({ status: "starting" })

    await vi.advanceTimersByTimeAsync(1)
    await deliverQueryUpdateScheduledDuringTick()

    expect(result.current).toEqual({ status: "done" })
    expect(pullPosition).not.toHaveBeenCalled()
  })

  it.each([
    [
      "failed",
      function failLookup(fetchConnection: Harness["fetchConnection"]) {
        fetchConnection.mockRejectedValue(new Error("API unreachable"))
      },
    ],
    [
      "took more than fifteen seconds",
      function holdLookup(fetchConnection: Harness["fetchConnection"]) {
        fetchConnection.mockReturnValue(
          Promise.withResolvers<ConnectionAnswer>().promise,
        )
      },
    ],
  ])(
    "does not wait on the connection lookup again once it %s",
    async (_, breakLookup) => {
      const { openBook, fetchConnection, pullPosition } = createCheckHarness()
      breakLookup(fetchConnection)
      const firstOpening = openBook()
      await vi.advanceTimersByTimeAsync(KOREADER_POSITION_CHECK_DEADLINE_MS)
      firstOpening.unmount()
      await vi.advanceTimersByTimeAsync(0)
      fetchConnection.mockReturnValue(
        Promise.withResolvers<ConnectionAnswer>().promise,
      )

      const { result } = openBook()
      await vi.advanceTimersByTimeAsync(0)

      expect(result.current).toEqual({ status: "done" })
      expect(pullPosition).not.toHaveBeenCalled()
    },
  )

  it("looks the account's connection up once rather than at each opening", async () => {
    const { openBook, fetchConnection } = createCheckHarness()
    const firstOpening = openBook()
    await vi.advanceTimersByTimeAsync(0)
    firstOpening.unmount()
    await vi.advanceTimersByTimeAsync(0)

    openBook()
    await vi.advanceTimersByTimeAsync(0)

    expect(fetchConnection).toHaveBeenCalledOnce()
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

    expect(result.current).toEqual({ status: "done" })
    expect(fetchConnection).toHaveBeenCalledTimes(2)
  })

  it("lets the book open right away without asking offline", async () => {
    setOnLine(false)
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
    expect(mocks.saveBook).toHaveBeenCalledExactlyOnceWith(
      BOOK_AT_NEWER_SERVER_POSITION,
    )
    expect(result.current).toEqual({ status: "done" })
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

  it("lets the book open once the user continues while asking, and keeps its bookmark whatever the answer", async () => {
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

    expect(mocks.saveBook).not.toHaveBeenCalled()
    expect(result.current).toEqual({ status: "done" })
  })
})
