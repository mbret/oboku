import {
  type BookDocType,
  createBookDefaults,
  ReadingStateState,
} from "@oboku/shared"
import type { Manifest } from "@prose-reader/shared"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { KoreaderPositionCheck } from "../koreader/syncConnection/useKoreaderPositionCheck"

const mocks = vi.hoisted(function createReaderMocks() {
  const reader = { mount: vi.fn(), destroy: vi.fn() }

  return {
    reader,
    createAppReader: vi.fn(function createFakeReader(_options: {
      target?: unknown
    }) {
      return reader
    }),
    readStoredBook: vi.fn((): BookDocType | null => null),
  }
})

vi.mock("@prose-reader/enhancer-koreader", function mockKoreaderEnhancer() {
  return {
    koreaderEnhancer: function enhanceIntoFakeReader() {
      return mocks.createAppReader
    },
  }
})

vi.mock("./streamer/webStreamer", function mockWebStreamer() {
  return {
    webStreamer: {
      prune: vi.fn(),
      accessArchiveWithoutLock: vi.fn(),
      fetchResource: vi.fn(),
    },
  }
})

vi.mock("../books/states", async function mockBookQuery(importOriginal) {
  const { skipToken } = await import("@tanstack/react-query")
  const { of } = await import("rxjs")

  return {
    ...(await importOriginal<typeof import("../books/states")>()),
    createBookQueryOptions: function createStoredBookQueryOptions({
      id,
    }: {
      id?: string
    }) {
      return {
        queryKey: ["stored-book", id],
        queryFn:
          id === undefined
            ? skipToken
            : function readStoredBook() {
                return of(mocks.readStoredBook())
              },
      }
    },
  }
})

import { useCreateReader } from "./useCreateReader"

const BOOK_ID = "book-1"
const KOREADER_DOCUMENT = "8f3a9c1e0b7d4f2a6c5e1d0b9a8f7e6d"
const BOOKMARK_CFI = "epubcfi(/6/4!/4/2/1:0)"
const KOREADER_PROGRESS = "/body/DocFragment[9]/body/p[12]/text().4"

const MANIFEST: Manifest = {
  filename: "book.epub",
  mediaType: "application/epub+zip",
  title: "Book",
  renditionLayout: undefined,
  renditionSpread: undefined,
  readingDirection: "ltr",
  spineItems: [],
  items: [],
}

const STORED_BOOK: BookDocType = {
  ...createBookDefaults(),
  _id: BOOK_ID,
  _rev: "2-book",
  rx_model: "book",
  rxdbMeta: { lwt: 1 },
  readingStateCurrentState: ReadingStateState.Reading,
  readingStateCurrentBookmarkLocation: BOOKMARK_CFI,
  readingStateCurrentBookmarkLocationUpdatedAt: "2026-10-20T08:00:00.000Z",
  readingStateCurrentBookmarkProgressPercent: 0.2,
  readingStateCurrentBookmarkKoreaderProgress:
    "/body/DocFragment[3]/body/p[2]/text().0",
  readingStateCurrentBookmarkKoreaderDocument: KOREADER_DOCUMENT,
}

const BOOK_WITH_ONLY_KOREADER_BOOKMARK: BookDocType = {
  ...STORED_BOOK,
  readingStateCurrentBookmarkLocation: null,
  readingStateCurrentBookmarkKoreaderProgress: KOREADER_PROGRESS,
}

const renderCreateReader = (initialCheck: KoreaderPositionCheck) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: 0 } },
  })
  const containerRef = { current: document.createElement("div") }

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  return renderHook(
    function renderUseCreateReader({
      koreaderPositionCheck,
    }: {
      koreaderPositionCheck: KoreaderPositionCheck
    }) {
      useCreateReader({
        bookId: BOOK_ID,
        isPreview: false,
        isUsingWebStreamer: false,
        manifest: MANIFEST,
        koreaderDocument: KOREADER_DOCUMENT,
        koreaderPositionCheck,
        containerRef,
      })
    },
    { wrapper, initialProps: { koreaderPositionCheck: initialCheck } },
  )
}

const settle = () => vi.advanceTimersByTimeAsync(10)

describe("useCreateReader", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mocks.createAppReader.mockClear()
    mocks.readStoredBook.mockReset().mockReturnValue(STORED_BOOK)
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it("waits for the KOReader position check before creating the reader", async () => {
    const { rerender } = renderCreateReader({
      status: "checking",
      continueAnyway: vi.fn(),
    })
    await settle()

    expect(mocks.readStoredBook).toHaveBeenCalled()
    expect(mocks.createAppReader).not.toHaveBeenCalled()

    rerender({ koreaderPositionCheck: { status: "done" } })
    await settle()

    expect(mocks.createAppReader).toHaveBeenCalledOnce()
  })

  it("opens at the bookmark's cfi", async () => {
    renderCreateReader({ status: "done" })
    await settle()

    expect(mocks.createAppReader).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        target: { type: "cfi", value: BOOKMARK_CFI },
      }),
    )
  })

  it("opens at the bookmark the KOReader position check took from the server", async () => {
    renderCreateReader({
      status: "done",
      updatedBook: BOOK_WITH_ONLY_KOREADER_BOOKMARK,
    })
    await settle()

    expect(mocks.createAppReader).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        target: { type: "koreaderProgress", value: KOREADER_PROGRESS },
      }),
    )
  })

  it("opens at the start when the bookmark is only in KOReader's form, for another file", async () => {
    mocks.readStoredBook.mockReturnValue({
      ...BOOK_WITH_ONLY_KOREADER_BOOKMARK,
      readingStateCurrentBookmarkKoreaderDocument: "document-of-another-file",
    })
    renderCreateReader({ status: "done" })
    await settle()

    expect(mocks.createAppReader).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ target: undefined }),
    )
  })
})
