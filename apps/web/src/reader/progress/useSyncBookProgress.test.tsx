// @vitest-environment jsdom

import { type BookDocType, ReadingStateState } from "@oboku/shared"
import type { ReadingPosition } from "@prose-reader/core"
import { renderHook } from "@testing-library/react"
import { Subject } from "rxjs"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

type FakePaginationResult = {
  isSettled: boolean
  percentageEstimateOfBook: number
}

type FakeReader = {
  navigation: { readingPosition$: Subject<ReadingPosition> }
  pagination: { state$: Subject<FakePaginationResult> }
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

import { useSyncBookProgress } from "./useSyncBookProgress"

const LAST_PAGE: ReadingPosition = {
  cfi: "epubcfi(/6/8!/4/2/1:0)",
  percentageEstimateOfBook: 0.9375,
}
const PAGE_BEFORE_LAST: ReadingPosition = {
  cfi: "epubcfi(/6/6!/4/40/1:0)",
  percentageEstimateOfBook: 0.875,
}

const FIRST_PAGE: ReadingPosition = {
  cfi: "epubcfi(/6/2!/4/2/1:0)",
  percentageEstimateOfBook: 0,
}

const END_OF_BOOK_VISIBLE: FakePaginationResult = {
  isSettled: true,
  percentageEstimateOfBook: 1,
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
  readingStateUpdatedAt: null,
  readingStateCurrentState: ReadingStateState.NotStarted,
  rx_model: "book",
  rxdbMeta: { lwt: 1 },
  tags: [],
}

function createFakeReader() {
  const reader: FakeReader = {
    navigation: { readingPosition$: new Subject() },
    pagination: { state$: new Subject() },
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

  it("saves the reading position with its own progress, and pagination's as the reached progress", async () => {
    const reader = createFakeReader()
    renderSyncBookProgress()

    reader.navigation.readingPosition$.next(LAST_PAGE)
    await vi.advanceTimersByTimeAsync(1000)
    reader.navigation.readingPosition$.next(PAGE_BEFORE_LAST)
    reader.pagination.state$.next({
      isSettled: true,
      percentageEstimateOfBook: 0.95,
    })
    await vi.advanceTimersByTimeAsync(1000)

    expect(mocks.state.book).toMatchObject({
      readingStateCurrentBookmarkLocation: PAGE_BEFORE_LAST.cfi,
      readingStateCurrentBookmarkProgressPercent:
        PAGE_BEFORE_LAST.percentageEstimateOfBook,
      readingStateReachedProgressPercent: 0.95,
      readingStateCurrentState: ReadingStateState.Reading,
      readingStateUpdatedAt: expect.any(String),
    })
  })

  it("writes the reading position and the reached progress of an interval at once", async () => {
    const reader = createFakeReader()
    renderSyncBookProgress()

    reader.navigation.readingPosition$.next(PAGE_BEFORE_LAST)
    reader.pagination.state$.next({
      isSettled: true,
      percentageEstimateOfBook: 0.9375,
    })
    await vi.advanceTimersByTimeAsync(1000)

    expect(mocks.incrementalBookModify).toHaveBeenCalledTimes(1)
    expect(mocks.state.book).toMatchObject({
      readingStateCurrentBookmarkProgressPercent:
        PAGE_BEFORE_LAST.percentageEstimateOfBook,
      readingStateReachedProgressPercent: 0.9375,
    })
  })

  it("takes the reading position's progress as the reached progress until the new place settles", async () => {
    const reader = createFakeReader()
    const { unmount } = renderSyncBookProgress()

    reader.navigation.readingPosition$.next(PAGE_BEFORE_LAST)
    reader.pagination.state$.next({
      isSettled: true,
      percentageEstimateOfBook: 0.9375,
    })
    await vi.advanceTimersByTimeAsync(1000)
    reader.navigation.readingPosition$.next(FIRST_PAGE)
    reader.pagination.state$.next({
      isSettled: false,
      percentageEstimateOfBook: 0.9375,
    })
    unmount()

    expect(mocks.state.book).toMatchObject({
      readingStateCurrentBookmarkLocation: FIRST_PAGE.cfi,
      readingStateCurrentBookmarkProgressPercent: 0,
      readingStateReachedProgressPercent: 0,
    })
  })

  it("ignores the reached progress of an estimate that has not settled", async () => {
    const reader = createFakeReader()
    renderSyncBookProgress()

    reader.pagination.state$.next({
      isSettled: false,
      percentageEstimateOfBook: 0.5,
    })
    await vi.advanceTimersByTimeAsync(1000)

    expect(mocks.incrementalBookModify).not.toHaveBeenCalled()
  })

  it("marks the book finished as soon as its end is visible, keeping the reading position", async () => {
    const reader = createFakeReader()
    renderSyncBookProgress()

    reader.navigation.readingPosition$.next(LAST_PAGE)
    await vi.advanceTimersByTimeAsync(1000)
    reader.pagination.state$.next(END_OF_BOOK_VISIBLE)

    expect(mocks.state.book).toMatchObject({
      readingStateCurrentBookmarkLocation: LAST_PAGE.cfi,
      readingStateCurrentBookmarkProgressPercent:
        LAST_PAGE.percentageEstimateOfBook,
      readingStateCurrentState: ReadingStateState.Finished,
    })
  })

  it("does not mark the book finished from an estimate that has not settled", async () => {
    const reader = createFakeReader()
    renderSyncBookProgress()

    reader.pagination.state$.next({
      ...END_OF_BOOK_VISIBLE,
      isSettled: false,
    })
    await vi.advanceTimersByTimeAsync(1000)

    expect(mocks.incrementalBookModify).not.toHaveBeenCalled()
  })

  it("does not mark the book finished from the reading position's progress", async () => {
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
    reader.pagination.state$.next({
      isSettled: true,
      percentageEstimateOfBook: 0.97,
    })
    unmount()

    expect(mocks.state.book).toMatchObject({
      readingStateCurrentBookmarkLocation: LAST_PAGE.cfi,
      readingStateCurrentBookmarkProgressPercent:
        LAST_PAGE.percentageEstimateOfBook,
      readingStateReachedProgressPercent: 0.97,
    })
  })
})
