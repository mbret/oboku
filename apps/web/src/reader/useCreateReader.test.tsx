import {
  type BookDocType,
  createBookDefaults,
  emptyBookmark,
  ReadingStateState,
} from "@oboku/shared"
import type { Manifest } from "@prose-reader/shared"
import { cleanup, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(function createReaderMocks() {
  const reader = { mount: vi.fn(), destroy: vi.fn() }

  return {
    reader,
    createAppReader: vi.fn(function createFakeReader(_options: {
      target?: unknown
    }) {
      return reader
    }),
  }
})

vi.mock("./createAppReader", function mockCreateAppReader() {
  return { createAppReader: mocks.createAppReader }
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

const BOOK: BookDocType = {
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
  ...BOOK,
  readingStateCurrentBookmarkLocation: null,
  readingStateCurrentBookmarkKoreaderProgress: KOREADER_PROGRESS,
}

const renderCreateReader = (initialBook: BookDocType | null | undefined) => {
  const containerRef = { current: document.createElement("div") }

  return renderHook(
    function renderUseCreateReader({
      book,
    }: {
      book: BookDocType | null | undefined
    }) {
      useCreateReader({
        bookId: BOOK_ID,
        isUsingWebStreamer: false,
        manifest: MANIFEST,
        koreaderDocument: KOREADER_DOCUMENT,
        book,
        containerRef,
      })
    },
    { initialProps: { book: initialBook } },
  )
}

describe("useCreateReader", () => {
  beforeEach(() => {
    mocks.createAppReader.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  it("waits for the book to open before creating the reader", () => {
    const { rerender } = renderCreateReader(undefined)

    expect(mocks.createAppReader).not.toHaveBeenCalled()

    rerender({ book: BOOK })

    expect(mocks.createAppReader).toHaveBeenCalledOnce()
  })

  it("opens at the bookmark's cfi", () => {
    renderCreateReader(BOOK)

    expect(mocks.createAppReader).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        target: { type: "cfi", value: BOOKMARK_CFI },
      }),
    )
  })

  it("opens at the bookmark's KOReader form when it has no cfi", () => {
    renderCreateReader(BOOK_WITH_ONLY_KOREADER_BOOKMARK)

    expect(mocks.createAppReader).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        target: { type: "koreaderProgress", value: KOREADER_PROGRESS },
      }),
    )
  })

  it("opens at the start when the bookmark is only in KOReader's form, for another file", () => {
    renderCreateReader({
      ...BOOK_WITH_ONLY_KOREADER_BOOKMARK,
      readingStateCurrentBookmarkKoreaderDocument: "document-of-another-file",
    })

    expect(mocks.createAppReader).toHaveBeenCalledExactlyOnceWith(
      expect.not.objectContaining({ target: expect.anything() }),
    )
  })

  it("opens at the start a book that has no bookmark", () => {
    renderCreateReader({ ...BOOK, ...emptyBookmark })

    expect(mocks.createAppReader).toHaveBeenCalledExactlyOnceWith(
      expect.not.objectContaining({ target: expect.anything() }),
    )
  })

  it("opens at the start without a book to restore", () => {
    renderCreateReader(null)

    expect(mocks.createAppReader).toHaveBeenCalledExactlyOnceWith(
      expect.not.objectContaining({ target: expect.anything() }),
    )
  })
})
