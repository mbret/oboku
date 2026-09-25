// @vitest-environment jsdom

import { type BookDocType, ReadingStateState } from "@oboku/shared"
import { renderHook } from "@testing-library/react"
import { BehaviorSubject, Subject } from "rxjs"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

type FakePaginationResult = {
  isSettled: boolean
  percentageEstimateOfBook: number
  begin: { cfi: string | undefined }
}

type FakeReader = {
  navigation: { readingPosition$: Subject<string> }
  pagination: { state$: BehaviorSubject<FakePaginationResult> }
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

const PAGE_START_CFI = "epubcfi(/6/4!/4/2/1:120)"
const READING_POSITION_CFI = "epubcfi(/6/4!/4/2/1:128)"

const UNSETTLED_ESTIMATE: FakePaginationResult = {
  isSettled: false,
  percentageEstimateOfBook: 0,
  begin: { cfi: undefined },
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

function createSettledResult(
  percentageEstimateOfBook: number,
): FakePaginationResult {
  return {
    isSettled: true,
    percentageEstimateOfBook,
    begin: { cfi: PAGE_START_CFI },
  }
}

function createFakeReader() {
  const reader: FakeReader = {
    navigation: { readingPosition$: new Subject() },
    pagination: { state$: new BehaviorSubject(UNSETTLED_ESTIMATE) },
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

  it("saves the reading position rather than the first visible page", async () => {
    const reader = createFakeReader()
    renderSyncBookProgress()

    reader.navigation.readingPosition$.next(READING_POSITION_CFI)
    reader.pagination.state$.next(createSettledResult(0.25))
    await vi.advanceTimersByTimeAsync(1000)

    expect(mocks.state.book).toMatchObject({
      readingStateCurrentBookmarkLocation: READING_POSITION_CFI,
      readingStateCurrentBookmarkProgressPercent: 0.25,
      readingStateCurrentState: ReadingStateState.Reading,
    })
  })

  it("ignores the progress of a pagination result that has not settled", async () => {
    const reader = createFakeReader()
    renderSyncBookProgress()

    reader.navigation.readingPosition$.next(READING_POSITION_CFI)
    await vi.advanceTimersByTimeAsync(1000)

    expect(mocks.incrementalBookModify).not.toHaveBeenCalled()

    reader.pagination.state$.next(createSettledResult(0.25))
    await vi.advanceTimersByTimeAsync(1000)
    reader.pagination.state$.next(UNSETTLED_ESTIMATE)
    await vi.advanceTimersByTimeAsync(1000)

    expect(mocks.incrementalBookModify).toHaveBeenCalledTimes(1)
    expect(mocks.state.book).toMatchObject({
      readingStateCurrentBookmarkProgressPercent: 0.25,
    })
  })

  it("marks the book finished as soon as the settled progress reaches the end", () => {
    const reader = createFakeReader()
    renderSyncBookProgress()

    reader.navigation.readingPosition$.next(READING_POSITION_CFI)
    reader.pagination.state$.next(createSettledResult(1))

    expect(mocks.state.book).toMatchObject({
      readingStateCurrentBookmarkProgressPercent: 1,
      readingStateCurrentState: ReadingStateState.Finished,
    })
  })

  it("saves the pending progress when unmounted", () => {
    const reader = createFakeReader()
    const { unmount } = renderSyncBookProgress()

    reader.navigation.readingPosition$.next(READING_POSITION_CFI)
    reader.pagination.state$.next(createSettledResult(0.5))
    unmount()

    expect(mocks.state.book).toMatchObject({
      readingStateCurrentBookmarkLocation: READING_POSITION_CFI,
      readingStateCurrentBookmarkProgressPercent: 0.5,
    })
  })
})
