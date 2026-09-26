// @vitest-environment jsdom

import { type BookDocType, ReadingStateState } from "@oboku/shared"
import type {
  BookBoundaryReachedEvent,
  ReadingPosition,
} from "@prose-reader/core"
import { renderHook } from "@testing-library/react"
import { Subject } from "rxjs"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

type FakeReader = {
  navigation: { readingPosition$: Subject<ReadingPosition> }
  bookBoundaryReached$: Subject<BookBoundaryReachedEvent>
}

const mocks = vi.hoisted(function createSyncBookProgressMocks() {
  const state: { reader?: FakeReader; book?: BookDocType } = {}

  const incrementalBookModify = vi.fn(async function modifyStoredBook({
    mutationFn,
  }: {
    mutationFn: (old: BookDocType) => BookDocType
  }) {
    if (!state.book) throw new Error("No book stored")

    state.book = mutationFn(state.book)

    return state.book
  })

  return { state, incrementalBookModify }
})

vi.mock("../states", function mockReaderState() {
  return {
    useReader: function useMockReader() {
      return mocks.state.reader
    },
  }
})

vi.mock("../../books", function mockBooks() {
  return {
    useIncrementalBookModify: function useMockIncrementalBookModify() {
      return { mutateAsync: mocks.incrementalBookModify }
    },
  }
})

vi.mock("@prose-reader/core", async function mockBookBoundary(importOriginal) {
  return {
    ...(await importOriginal<typeof import("@prose-reader/core")>()),
    observeBookBoundaryReached: function observeFakeBookBoundaryReached(
      reader: FakeReader,
    ) {
      return reader.bookBoundaryReached$
    },
  }
})

import { useSyncBookProgress } from "./useSyncBookProgress"

const LAST_PAGE: ReadingPosition = {
  cfi: "epubcfi(/6/8!/4/2/1:0)",
  percentageEstimateOfBook: 0.9375,
}
const PAGE_BEFORE_LAST: ReadingPosition = {
  cfi: "epubcfi(/6/6!/4/40/1:0)",
  percentageEstimateOfBook: 0.875,
}

const book: BookDocType = {
  _id: "book-1",
  _rev: "1-book",
  collections: [],
  createdAt: 1,
  isAttachedToDataSource: true,
  lastMetadataUpdateError: null,
  lastMetadataUpdatedAt: null,
  links: [],
  metadataUpdateStatus: null,
  modifiedAt: null,
  readingStateCurrentBookmarkLocation: null,
  readingStateCurrentBookmarkProgressPercent: 0,
  readingStateCurrentBookmarkProgressUpdatedAt: null,
  readingStateCurrentState: ReadingStateState.NotStarted,
  rx_model: "book",
  rxdbMeta: { lwt: 1 },
  tags: [],
}

function createFakeReader() {
  const reader: FakeReader = {
    navigation: { readingPosition$: new Subject() },
    bookBoundaryReached$: new Subject(),
  }

  mocks.state.reader = reader

  return reader
}

function renderSyncBookProgress() {
  return renderHook(function renderUseSyncBookProgress() {
    useSyncBookProgress(book._id)
  })
}

describe("useSyncBookProgress", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mocks.incrementalBookModify.mockClear()
    mocks.state.book = book
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("saves the reading position with its own progress", async () => {
    const reader = createFakeReader()
    renderSyncBookProgress()

    reader.navigation.readingPosition$.next(LAST_PAGE)
    await vi.advanceTimersByTimeAsync(1000)
    reader.navigation.readingPosition$.next(PAGE_BEFORE_LAST)
    await vi.advanceTimersByTimeAsync(1000)

    expect(mocks.state.book).toMatchObject({
      readingStateCurrentBookmarkLocation: PAGE_BEFORE_LAST.cfi,
      readingStateCurrentBookmarkProgressPercent:
        PAGE_BEFORE_LAST.percentageEstimateOfBook,
      readingStateCurrentState: ReadingStateState.Reading,
    })
  })

  it("does not mark the book finished for being on its last page", async () => {
    const reader = createFakeReader()
    renderSyncBookProgress()

    reader.navigation.readingPosition$.next({
      ...LAST_PAGE,
      percentageEstimateOfBook: 1,
    })
    await vi.advanceTimersByTimeAsync(1000)

    expect(mocks.state.book).toMatchObject({
      readingStateCurrentState: ReadingStateState.Reading,
    })
  })

  it("marks the book finished as soon as the reader reaches its end, keeping the reading position", async () => {
    const reader = createFakeReader()
    renderSyncBookProgress()

    reader.navigation.readingPosition$.next(LAST_PAGE)
    await vi.advanceTimersByTimeAsync(1000)
    reader.bookBoundaryReached$.next({ boundary: "end" })

    expect(mocks.state.book).toMatchObject({
      readingStateCurrentBookmarkLocation: LAST_PAGE.cfi,
      readingStateCurrentBookmarkProgressPercent:
        LAST_PAGE.percentageEstimateOfBook,
      readingStateCurrentState: ReadingStateState.Finished,
    })
  })

  it("does not mark the book finished when the reader reaches its start", async () => {
    const reader = createFakeReader()
    renderSyncBookProgress()

    reader.bookBoundaryReached$.next({ boundary: "start" })
    await vi.advanceTimersByTimeAsync(1000)

    expect(mocks.incrementalBookModify).not.toHaveBeenCalled()
  })

  it("keeps a finished book finished as the reader moves in it", async () => {
    mocks.state.book = {
      ...book,
      readingStateCurrentState: ReadingStateState.Finished,
    }
    const reader = createFakeReader()
    renderSyncBookProgress()

    reader.navigation.readingPosition$.next(PAGE_BEFORE_LAST)
    await vi.advanceTimersByTimeAsync(1000)

    expect(mocks.state.book).toMatchObject({
      readingStateCurrentBookmarkLocation: PAGE_BEFORE_LAST.cfi,
      readingStateCurrentState: ReadingStateState.Finished,
    })
  })

  it("saves the pending reading position when unmounted", () => {
    const reader = createFakeReader()
    const { unmount } = renderSyncBookProgress()

    reader.navigation.readingPosition$.next(LAST_PAGE)
    unmount()

    expect(mocks.state.book).toMatchObject({
      readingStateCurrentBookmarkLocation: LAST_PAGE.cfi,
      readingStateCurrentBookmarkProgressPercent:
        LAST_PAGE.percentageEstimateOfBook,
    })
  })
})
