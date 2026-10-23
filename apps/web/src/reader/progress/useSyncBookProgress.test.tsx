import { type BookDocType, ReadingStateState } from "@oboku/shared"
import type { DocumentLoadStatus, ReadingPosition } from "@prose-reader/core"
import { cleanup, renderHook } from "@testing-library/react"
import { Subject } from "rxjs"
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  onTestFinished,
  vi,
} from "vitest"

type FakePaginationResult = {
  isSettled: boolean
  percentageEstimateOfBook: number
  end: { spineItemIndex: number }
}

type FakeSpineItem = { value: { loadStatus: DocumentLoadStatus } }

type FakeReader = {
  navigation: { readingPosition$: Subject<ReadingPosition> }
  pagination: { state$: Subject<FakePaginationResult> }
  spineItemsManager: { get: (spineItemIndex: number) => FakeSpineItem }
  koreader: { cfiToProgress: (cfi: string) => string | undefined }
}

const mocks = vi.hoisted(function createSyncBookProgressMocks() {
  const state: {
    reader?: FakeReader
    book?: BookDocType
  } = {}

  const toStoredDocument = (storedBook: BookDocType) => ({
    toJSON: function toStoredBook() {
      return storedBook
    },
  })

  const incrementalBookModify = vi.fn(async function modifyStoredBook({
    mutationFn,
  }: {
    mutationFn: (old: BookDocType) => BookDocType
  }) {
    if (!state.book) throw new Error("No book stored")

    state.book = mutationFn(state.book)

    return toStoredDocument(state.book)
  })

  return { state, incrementalBookModify, toStoredDocument }
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

import { bookmarkMoved$ } from "../events"
import { useSyncBookProgress } from "./useSyncBookProgress"

const KOREADER_DOCUMENT = "8f3a9c1e0b7d4f2a6c5e1d0b9a8f7e6d"

const LAST_PAGE: ReadingPosition = {
  cfi: "epubcfi(/6/8!/4/2/1:0)",
  percentageEstimateOfBook: 0.9375,
  status: "success",
}
const PAGE_BEFORE_LAST: ReadingPosition = {
  cfi: "epubcfi(/6/6!/4/40/1:0)",
  percentageEstimateOfBook: 0.875,
  status: "success",
}

const FIRST_PAGE: ReadingPosition = {
  cfi: "epubcfi(/6/2!/4/2/1:0)",
  percentageEstimateOfBook: 0,
  status: "success",
}

const LAST_CHAPTER_START_STANDING_IN: ReadingPosition = {
  cfi: "epubcfi(/6/8!)",
  percentageEstimateOfBook: 0.9375,
  status: "pending",
}

const SPREAD_FIRST_PAGE: ReadingPosition = {
  cfi: "epubcfi(/6/4!/4/2/1:0)",
  percentageEstimateOfBook: 0.5,
  status: "success",
}
const SPREAD_SECOND_PAGE: ReadingPosition = {
  cfi: "epubcfi(/6/6!/4/2/1:0)",
  percentageEstimateOfBook: 0.5625,
  status: "success",
}
const SPREAD_ESTIMATE = 0.625

const LAST_SPINE_ITEM_INDEX = 3

const END_OF_BOOK_VISIBLE: FakePaginationResult = {
  isSettled: true,
  percentageEstimateOfBook: 1,
  end: { spineItemIndex: LAST_SPINE_ITEM_INDEX },
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

const toFakeKoreaderProgress = (cfi: string) =>
  `/body/DocFragment[1]/body/p.${cfi}`

function createFakeReader({
  failedSpineItemIndexes = [],
  cfisWithoutKoreaderProgress = [],
}: {
  failedSpineItemIndexes?: number[]
  cfisWithoutKoreaderProgress?: string[]
} = {}) {
  const reader: FakeReader = {
    navigation: { readingPosition$: new Subject() },
    pagination: { state$: new Subject() },
    spineItemsManager: {
      get: function getFakeSpineItem(spineItemIndex) {
        const didFailToLoad = failedSpineItemIndexes.includes(spineItemIndex)

        return {
          value: { loadStatus: didFailToLoad ? "error" : "loaded" },
        }
      },
    },
    koreader: {
      cfiToProgress: function toFakeKoreaderProgressUnlessUnconvertible(cfi) {
        return cfisWithoutKoreaderProgress.includes(cfi)
          ? undefined
          : toFakeKoreaderProgress(cfi)
      },
    },
  }

  mocks.state.reader = reader

  return reader
}

function renderSyncBookProgress({
  koreaderDocument = KOREADER_DOCUMENT,
}: {
  koreaderDocument?: string
} = {}) {
  return renderHook(function renderUseSyncBookProgress() {
    useSyncBookProgress(book._id, { koreaderDocument })
  })
}

describe("useSyncBookProgress", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mocks.incrementalBookModify.mockClear()
    mocks.state.book = book
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
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
      end: { spineItemIndex: LAST_SPINE_ITEM_INDEX },
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

  it("moves the book up in recent activity when it is opened, leaving its bookmark's date", async () => {
    const lastReadAt = "2026-01-01T00:00:00.000Z"
    mocks.state.book = {
      ...book,
      readingStateCurrentBookmarkLocation: LAST_PAGE.cfi,
      readingStateCurrentBookmarkLocationUpdatedAt: lastReadAt,
      readingStateCurrentBookmarkProgressPercent:
        LAST_PAGE.percentageEstimateOfBook,
      readingStateReachedProgressPercent: 0.97,
      readingStateCurrentState: ReadingStateState.Reading,
      readingStateUpdatedAt: lastReadAt,
    }
    const reader = createFakeReader()
    renderSyncBookProgress()

    reader.navigation.readingPosition$.next(LAST_CHAPTER_START_STANDING_IN)
    reader.navigation.readingPosition$.next(LAST_PAGE)
    reader.pagination.state$.next({
      isSettled: true,
      percentageEstimateOfBook: 0.97,
      end: { spineItemIndex: LAST_SPINE_ITEM_INDEX },
    })
    await vi.advanceTimersByTimeAsync(1000)

    expect(mocks.state.book?.readingStateUpdatedAt).not.toBe(lastReadAt)
    expect(mocks.state.book).toMatchObject({
      readingStateCurrentBookmarkLocation: LAST_PAGE.cfi,
      readingStateCurrentBookmarkLocationUpdatedAt: lastReadAt,
      readingStateReachedProgressPercent: 0.97,
    })
  })

  it("moves the book up in recent activity and dates its bookmark when the bookmark moves", async () => {
    const lastReadAt = "2026-01-01T00:00:00.000Z"
    mocks.state.book = {
      ...book,
      readingStateCurrentBookmarkLocation: PAGE_BEFORE_LAST.cfi,
      readingStateCurrentBookmarkLocationUpdatedAt: lastReadAt,
      readingStateCurrentBookmarkProgressPercent:
        PAGE_BEFORE_LAST.percentageEstimateOfBook,
      readingStateReachedProgressPercent: LAST_PAGE.percentageEstimateOfBook,
      readingStateCurrentState: ReadingStateState.Reading,
      readingStateUpdatedAt: lastReadAt,
    }
    const reader = createFakeReader()
    renderSyncBookProgress()
    reader.navigation.readingPosition$.next(PAGE_BEFORE_LAST)
    await vi.advanceTimersByTimeAsync(1000)
    const openedAt = mocks.state.book?.readingStateUpdatedAt

    reader.navigation.readingPosition$.next(LAST_PAGE)
    await vi.advanceTimersByTimeAsync(1000)

    expect(mocks.state.book?.readingStateUpdatedAt).not.toBe(openedAt)
    expect(
      mocks.state.book?.readingStateCurrentBookmarkLocationUpdatedAt,
    ).not.toBe(lastReadAt)
  })

  it("dates the bookmark when the book opens somewhere other than where it was saved", async () => {
    const lastReadAt = "2026-01-01T00:00:00.000Z"
    mocks.state.book = {
      ...book,
      readingStateCurrentBookmarkLocation: LAST_CHAPTER_START_STANDING_IN.cfi,
      readingStateCurrentBookmarkLocationUpdatedAt: lastReadAt,
      readingStateCurrentBookmarkProgressPercent:
        LAST_CHAPTER_START_STANDING_IN.percentageEstimateOfBook,
      readingStateCurrentState: ReadingStateState.Reading,
    }
    const reader = createFakeReader()
    renderSyncBookProgress()

    reader.navigation.readingPosition$.next(LAST_CHAPTER_START_STANDING_IN)
    reader.navigation.readingPosition$.next(LAST_PAGE)
    await vi.advanceTimersByTimeAsync(1000)

    expect(mocks.state.book?.readingStateCurrentBookmarkLocation).toBe(
      LAST_PAGE.cfi,
    )
    expect(
      mocks.state.book?.readingStateCurrentBookmarkLocationUpdatedAt,
    ).not.toBe(lastReadAt)
  })

  it("leaves the bookmark of a book opened for the first time undated", async () => {
    mocks.state.book = {
      ...book,
      readingStateCurrentBookmarkLocationUpdatedAt: null,
    }
    const reader = createFakeReader()
    renderSyncBookProgress()

    reader.navigation.readingPosition$.next(FIRST_PAGE)
    await vi.advanceTimersByTimeAsync(1000)

    expect(mocks.state.book).toMatchObject({
      readingStateCurrentBookmarkLocation: FIRST_PAGE.cfi,
      readingStateCurrentBookmarkLocationUpdatedAt: null,
    })
  })

  it("keeps the bookmark's date when the progress of its place is recomputed", async () => {
    const reader = createFakeReader()
    renderSyncBookProgress()

    reader.navigation.readingPosition$.next(PAGE_BEFORE_LAST)
    reader.navigation.readingPosition$.next(LAST_PAGE)
    await vi.advanceTimersByTimeAsync(1000)
    const movedAt =
      mocks.state.book?.readingStateCurrentBookmarkLocationUpdatedAt

    reader.navigation.readingPosition$.next({
      ...LAST_PAGE,
      percentageEstimateOfBook: 0.94,
    })
    await vi.advanceTimersByTimeAsync(1000)

    expect(movedAt).toEqual(expect.any(String))
    expect(mocks.state.book).toMatchObject({
      readingStateCurrentBookmarkProgressPercent: 0.94,
      readingStateCurrentBookmarkLocationUpdatedAt: movedAt,
    })
  })

  it("leaves recent activity alone when only the reached progress changes", async () => {
    const reader = createFakeReader()
    renderSyncBookProgress()
    await vi.advanceTimersByTimeAsync(1000)
    const openedAt = mocks.state.book?.readingStateUpdatedAt

    reader.pagination.state$.next({
      isSettled: true,
      percentageEstimateOfBook: 0.5,
      end: { spineItemIndex: LAST_SPINE_ITEM_INDEX },
    })
    await vi.advanceTimersByTimeAsync(1000)

    expect(openedAt).toEqual(expect.any(String))
    expect(mocks.state.book).toMatchObject({
      readingStateReachedProgressPercent: 0.5,
      readingStateUpdatedAt: openedAt,
    })
  })

  it("saves the KOReader progress, and the document of the file it was read in, with the bookmark", async () => {
    const reader = createFakeReader()
    renderSyncBookProgress()

    reader.navigation.readingPosition$.next(LAST_PAGE)
    await vi.advanceTimersByTimeAsync(1000)

    expect(mocks.state.book).toMatchObject({
      readingStateCurrentBookmarkLocation: LAST_PAGE.cfi,
      readingStateCurrentBookmarkKoreaderProgress: toFakeKoreaderProgress(
        LAST_PAGE.cfi,
      ),
      readingStateCurrentBookmarkKoreaderDocument: KOREADER_DOCUMENT,
    })
  })

  it("takes the document of the file being read for a bookmark saved in another file, leaving the bookmark's date", async () => {
    const lastReadAt = "2026-01-01T00:00:00.000Z"
    mocks.state.book = {
      ...book,
      readingStateCurrentBookmarkLocation: LAST_PAGE.cfi,
      readingStateCurrentBookmarkLocationUpdatedAt: lastReadAt,
      readingStateCurrentBookmarkProgressPercent:
        LAST_PAGE.percentageEstimateOfBook,
      readingStateCurrentBookmarkKoreaderProgress: toFakeKoreaderProgress(
        LAST_PAGE.cfi,
      ),
      readingStateCurrentBookmarkKoreaderDocument: "document-of-another-file",
      readingStateReachedProgressPercent: LAST_PAGE.percentageEstimateOfBook,
      readingStateCurrentState: ReadingStateState.Reading,
      readingStateUpdatedAt: lastReadAt,
    }
    const reader = createFakeReader()
    renderSyncBookProgress()

    reader.navigation.readingPosition$.next(LAST_PAGE)
    await vi.advanceTimersByTimeAsync(1000)

    expect(mocks.state.book).toMatchObject({
      readingStateCurrentBookmarkKoreaderDocument: KOREADER_DOCUMENT,
      readingStateCurrentBookmarkLocationUpdatedAt: lastReadAt,
    })
  })

  it("adds the KOReader progress and document to a bookmark saved without them, leaving the bookmark's date", async () => {
    const lastReadAt = "2026-01-01T00:00:00.000Z"
    mocks.state.book = {
      ...book,
      readingStateCurrentBookmarkLocation: LAST_PAGE.cfi,
      readingStateCurrentBookmarkLocationUpdatedAt: lastReadAt,
      readingStateCurrentBookmarkProgressPercent:
        LAST_PAGE.percentageEstimateOfBook,
      readingStateReachedProgressPercent: LAST_PAGE.percentageEstimateOfBook,
      readingStateCurrentState: ReadingStateState.Reading,
      readingStateUpdatedAt: lastReadAt,
    }
    const reader = createFakeReader()
    renderSyncBookProgress()

    reader.navigation.readingPosition$.next(LAST_PAGE)
    await vi.advanceTimersByTimeAsync(1000)

    expect(mocks.state.book).toMatchObject({
      readingStateCurrentBookmarkKoreaderProgress: toFakeKoreaderProgress(
        LAST_PAGE.cfi,
      ),
      readingStateCurrentBookmarkKoreaderDocument: KOREADER_DOCUMENT,
      readingStateCurrentBookmarkLocationUpdatedAt: lastReadAt,
    })
  })

  it("drops the KOReader progress of the previous bookmark when the new one has none", async () => {
    mocks.state.book = {
      ...book,
      readingStateCurrentBookmarkLocation: PAGE_BEFORE_LAST.cfi,
      readingStateCurrentBookmarkKoreaderProgress: toFakeKoreaderProgress(
        PAGE_BEFORE_LAST.cfi,
      ),
    }
    const reader = createFakeReader({
      cfisWithoutKoreaderProgress: [LAST_PAGE.cfi],
    })
    renderSyncBookProgress()

    reader.navigation.readingPosition$.next(LAST_PAGE)
    await vi.advanceTimersByTimeAsync(1000)

    expect(mocks.state.book).toMatchObject({
      readingStateCurrentBookmarkLocation: LAST_PAGE.cfi,
      readingStateCurrentBookmarkKoreaderProgress: null,
    })
  })

  it("keeps the bookmark the book opened at when it closes before the reader finds it", () => {
    mocks.state.book = {
      ...book,
      readingStateCurrentBookmarkLocation: LAST_PAGE.cfi,
      readingStateCurrentBookmarkProgressPercent:
        LAST_PAGE.percentageEstimateOfBook,
      readingStateCurrentBookmarkKoreaderProgress: toFakeKoreaderProgress(
        LAST_PAGE.cfi,
      ),
      readingStateReachedProgressPercent: 0.97,
      readingStateCurrentState: ReadingStateState.Reading,
    }
    const reader = createFakeReader()
    const { unmount } = renderSyncBookProgress()

    reader.navigation.readingPosition$.next(LAST_CHAPTER_START_STANDING_IN)
    reader.navigation.readingPosition$.next({
      ...LAST_PAGE,
      status: "pending",
    })
    unmount()

    expect(mocks.state.book).toMatchObject({
      readingStateCurrentBookmarkLocation: LAST_PAGE.cfi,
      readingStateCurrentBookmarkProgressPercent:
        LAST_PAGE.percentageEstimateOfBook,
      readingStateCurrentBookmarkKoreaderProgress: toFakeKoreaderProgress(
        LAST_PAGE.cfi,
      ),
      readingStateReachedProgressPercent: 0.97,
    })
  })

  it("writes nothing more when the reading position only changes status", async () => {
    const reader = createFakeReader()
    renderSyncBookProgress()

    reader.navigation.readingPosition$.next(LAST_PAGE)
    await vi.advanceTimersByTimeAsync(1000)
    reader.navigation.readingPosition$.next({
      ...LAST_PAGE,
      status: "pending",
    })
    reader.navigation.readingPosition$.next(LAST_PAGE)
    await vi.advanceTimersByTimeAsync(1000)

    expect(mocks.incrementalBookModify).toHaveBeenCalledTimes(1)
  })

  it("writes the reading position and the reached progress of an interval at once", async () => {
    const reader = createFakeReader()
    renderSyncBookProgress()

    reader.navigation.readingPosition$.next(PAGE_BEFORE_LAST)
    reader.pagination.state$.next({
      isSettled: true,
      percentageEstimateOfBook: 0.9375,
      end: { spineItemIndex: 2 },
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
      end: { spineItemIndex: 2 },
    })
    await vi.advanceTimersByTimeAsync(1000)
    reader.navigation.readingPosition$.next(FIRST_PAGE)
    reader.pagination.state$.next({
      isSettled: false,
      percentageEstimateOfBook: 0.9375,
      end: { spineItemIndex: 2 },
    })
    unmount()

    expect(mocks.state.book).toMatchObject({
      readingStateCurrentBookmarkLocation: FIRST_PAGE.cfi,
      readingStateCurrentBookmarkProgressPercent: 0,
      readingStateReachedProgressPercent: 0,
    })
  })

  it("takes the settled estimate back as the reached progress when the reading position moves within the pages shown", async () => {
    const reader = createFakeReader()
    renderSyncBookProgress()

    reader.navigation.readingPosition$.next(SPREAD_FIRST_PAGE)
    reader.pagination.state$.next({
      isSettled: true,
      percentageEstimateOfBook: SPREAD_ESTIMATE,
      end: { spineItemIndex: 2 },
    })
    await vi.advanceTimersByTimeAsync(1000)
    reader.navigation.readingPosition$.next(SPREAD_SECOND_PAGE)
    reader.pagination.state$.next({
      isSettled: false,
      percentageEstimateOfBook: SPREAD_ESTIMATE,
      end: { spineItemIndex: 2 },
    })
    reader.pagination.state$.next({
      isSettled: true,
      percentageEstimateOfBook: SPREAD_ESTIMATE,
      end: { spineItemIndex: 2 },
    })
    await vi.advanceTimersByTimeAsync(1000)

    expect(mocks.state.book).toMatchObject({
      readingStateCurrentBookmarkLocation: SPREAD_SECOND_PAGE.cfi,
      readingStateCurrentBookmarkProgressPercent:
        SPREAD_SECOND_PAGE.percentageEstimateOfBook,
      readingStateReachedProgressPercent: SPREAD_ESTIMATE,
    })
  })

  it("ignores the reached progress of an estimate that has not settled", async () => {
    const reader = createFakeReader()
    renderSyncBookProgress()

    reader.pagination.state$.next({
      isSettled: false,
      percentageEstimateOfBook: 0.5,
      end: { spineItemIndex: 0 },
    })
    await vi.advanceTimersByTimeAsync(1000)

    expect(mocks.state.book?.readingStateReachedProgressPercent).not.toBe(0.5)
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

    expect(mocks.state.book).toMatchObject({
      readingStateCurrentState: ReadingStateState.NotStarted,
    })
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

  it("keeps the bookmark and does not finish the book when its last chapter fails to load", async () => {
    const reader = createFakeReader({
      failedSpineItemIndexes: [LAST_SPINE_ITEM_INDEX],
    })
    renderSyncBookProgress()

    reader.navigation.readingPosition$.next(PAGE_BEFORE_LAST)
    await vi.advanceTimersByTimeAsync(1000)
    reader.navigation.readingPosition$.next({
      ...LAST_CHAPTER_START_STANDING_IN,
      status: "error",
    })
    reader.pagination.state$.next(END_OF_BOOK_VISIBLE)
    await vi.advanceTimersByTimeAsync(1000)

    expect(mocks.state.book).toMatchObject({
      readingStateCurrentBookmarkLocation: PAGE_BEFORE_LAST.cfi,
      readingStateReachedProgressPercent:
        PAGE_BEFORE_LAST.percentageEstimateOfBook,
      readingStateCurrentState: ReadingStateState.Reading,
    })
  })

  it("marks the book finished when its last page loaded, whatever the reading position's status", async () => {
    const reader = createFakeReader({ failedSpineItemIndexes: [2] })
    renderSyncBookProgress()

    reader.navigation.readingPosition$.next({
      ...PAGE_BEFORE_LAST,
      status: "error",
    })
    reader.pagination.state$.next(END_OF_BOOK_VISIBLE)

    expect(mocks.state.book).toMatchObject({
      readingStateCurrentState: ReadingStateState.Finished,
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

  it("saves the pending reading position when unmounted while the finished write is still running", async () => {
    const reader = createFakeReader()
    const { unmount } = renderSyncBookProgress()

    reader.navigation.readingPosition$.next(LAST_PAGE)
    reader.pagination.state$.next(END_OF_BOOK_VISIBLE)
    unmount()
    await vi.advanceTimersByTimeAsync(0)

    expect(mocks.state.book).toMatchObject({
      readingStateCurrentState: ReadingStateState.Finished,
      readingStateCurrentBookmarkLocation: LAST_PAGE.cfi,
      readingStateReachedProgressPercent: 1,
    })
  })

  it("saves nothing the reader reports once unmounted", async () => {
    const reader = createFakeReader()
    const { unmount } = renderSyncBookProgress()

    unmount()
    reader.navigation.readingPosition$.next(LAST_PAGE)
    reader.pagination.state$.next(END_OF_BOOK_VISIBLE)
    await vi.advanceTimersByTimeAsync(1000)

    expect(mocks.state.book).toMatchObject({
      readingStateCurrentBookmarkLocation: null,
      readingStateCurrentState: ReadingStateState.NotStarted,
    })
  })

  it("saves the pending reading position when unmounted", () => {
    const reader = createFakeReader()
    const { unmount } = renderSyncBookProgress()

    reader.navigation.readingPosition$.next(LAST_PAGE)
    reader.pagination.state$.next({
      isSettled: true,
      percentageEstimateOfBook: 0.97,
      end: { spineItemIndex: LAST_SPINE_ITEM_INDEX },
    })
    unmount()

    expect(mocks.state.book).toMatchObject({
      readingStateCurrentBookmarkLocation: LAST_PAGE.cfi,
      readingStateCurrentBookmarkProgressPercent:
        LAST_PAGE.percentageEstimateOfBook,
      readingStateReachedProgressPercent: 0.97,
    })
  })

  it("keeps saving the reading position after a write fails", async () => {
    mocks.incrementalBookModify.mockRejectedValueOnce(new Error("write failed"))
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(function silenceFailedWrite() {})
    const reader = createFakeReader()
    renderSyncBookProgress()

    reader.navigation.readingPosition$.next(PAGE_BEFORE_LAST)
    await vi.advanceTimersByTimeAsync(1000)
    reader.navigation.readingPosition$.next(LAST_PAGE)
    await vi.advanceTimersByTimeAsync(1000)

    expect(consoleError).toHaveBeenCalledOnce()
    expect(mocks.state.book?.readingStateCurrentBookmarkLocation).toBe(
      LAST_PAGE.cfi,
    )
  })

  describe("dispatching the bookmark's moves", () => {
    const bookReadOnPageBeforeLast: BookDocType = {
      ...book,
      readingStateCurrentBookmarkLocation: PAGE_BEFORE_LAST.cfi,
      readingStateCurrentBookmarkProgressPercent:
        PAGE_BEFORE_LAST.percentageEstimateOfBook,
      readingStateCurrentState: ReadingStateState.Reading,
    }

    const observeMovedBookmarks = () => {
      const onBookmarkMoved = vi.fn()
      const subscription = bookmarkMoved$.subscribe(onBookmarkMoved)

      onTestFinished(function stopObservingMovedBookmarks() {
        subscription.unsubscribe()
      })

      return onBookmarkMoved
    }

    beforeEach(() => {
      mocks.state.book = bookReadOnPageBeforeLast
    })

    it("dispatches each move of the bookmark, dated as its save dated the bookmark", async () => {
      const onBookmarkMoved = observeMovedBookmarks()
      const reader = createFakeReader()
      renderSyncBookProgress()
      reader.navigation.readingPosition$.next(PAGE_BEFORE_LAST)
      await vi.advanceTimersByTimeAsync(1000)

      reader.navigation.readingPosition$.next(FIRST_PAGE)
      await vi.advanceTimersByTimeAsync(1000)
      const movedToFirstPageAt =
        mocks.state.book?.readingStateCurrentBookmarkLocationUpdatedAt
      reader.navigation.readingPosition$.next(LAST_PAGE)
      await vi.advanceTimersByTimeAsync(1000)

      expect(onBookmarkMoved).toHaveBeenCalledTimes(2)
      expect(onBookmarkMoved).toHaveBeenNthCalledWith(1, {
        bookId: book._id,
        koreaderDocument: KOREADER_DOCUMENT,
        movedAt: movedToFirstPageAt,
      })
      expect(onBookmarkMoved).toHaveBeenLastCalledWith({
        bookId: book._id,
        koreaderDocument: KOREADER_DOCUMENT,
        movedAt: mocks.state.book?.readingStateCurrentBookmarkLocationUpdatedAt,
      })
      expect(movedToFirstPageAt).not.toBe(
        mocks.state.book?.readingStateCurrentBookmarkLocationUpdatedAt,
      )
    })

    it("does not dispatch the place the book opens at", async () => {
      const onBookmarkMoved = observeMovedBookmarks()
      const reader = createFakeReader()
      renderSyncBookProgress()

      reader.navigation.readingPosition$.next(PAGE_BEFORE_LAST)
      await vi.advanceTimersByTimeAsync(1000)

      expect(mocks.incrementalBookModify).toHaveBeenCalled()
      expect(onBookmarkMoved).not.toHaveBeenCalled()
    })

    it("does not dispatch the place a bookmark only in KOReader's form opens at, leaving its date", async () => {
      const takenFromServerAt = "2026-01-01T00:00:00.000Z"
      mocks.state.book = {
        ...bookReadOnPageBeforeLast,
        readingStateCurrentBookmarkLocation: null,
        readingStateCurrentBookmarkLocationUpdatedAt: takenFromServerAt,
        readingStateCurrentBookmarkProgressPercent:
          LAST_PAGE.percentageEstimateOfBook,
        readingStateCurrentBookmarkKoreaderProgress: toFakeKoreaderProgress(
          LAST_PAGE.cfi,
        ),
        readingStateCurrentBookmarkKoreaderDocument: KOREADER_DOCUMENT,
      }
      const onBookmarkMoved = observeMovedBookmarks()
      const reader = createFakeReader()
      renderSyncBookProgress()

      reader.navigation.readingPosition$.next(LAST_PAGE)
      await vi.advanceTimersByTimeAsync(1000)

      expect(mocks.state.book).toMatchObject({
        readingStateCurrentBookmarkLocation: LAST_PAGE.cfi,
        readingStateCurrentBookmarkLocationUpdatedAt: takenFromServerAt,
      })
      expect(onBookmarkMoved).not.toHaveBeenCalled()
    })

    it("dispatches the last move once the book closes, after it is saved", async () => {
      const onBookmarkMoved = observeMovedBookmarks()
      const reader = createFakeReader()
      const { unmount } = renderSyncBookProgress()
      reader.navigation.readingPosition$.next(PAGE_BEFORE_LAST)
      await vi.advanceTimersByTimeAsync(1000)

      reader.navigation.readingPosition$.next(LAST_PAGE)
      unmount()
      await vi.advanceTimersByTimeAsync(0)

      expect(mocks.state.book?.readingStateCurrentBookmarkLocation).toBe(
        LAST_PAGE.cfi,
      )
      expect(onBookmarkMoved).toHaveBeenCalledExactlyOnceWith({
        bookId: book._id,
        koreaderDocument: KOREADER_DOCUMENT,
        movedAt: mocks.state.book?.readingStateCurrentBookmarkLocationUpdatedAt,
      })
    })

    it("does not dispatch a move whose save fails", async () => {
      vi.spyOn(console, "error").mockImplementation(
        function silenceFailedWrite() {},
      )
      const onBookmarkMoved = observeMovedBookmarks()
      const reader = createFakeReader()
      renderSyncBookProgress()
      reader.navigation.readingPosition$.next(PAGE_BEFORE_LAST)
      await vi.advanceTimersByTimeAsync(1000)
      mocks.incrementalBookModify.mockImplementationOnce(
        async function failAfterPatching({ mutationFn }) {
          mutationFn(bookReadOnPageBeforeLast)

          throw new Error("write failed")
        },
      )

      reader.navigation.readingPosition$.next(LAST_PAGE)
      await vi.advanceTimersByTimeAsync(1000)

      expect(onBookmarkMoved).not.toHaveBeenCalled()
    })

    it("does not dispatch a move made only by a run RxDB discarded on a conflict", async () => {
      const bookMovedToLastPageElsewhere: BookDocType = {
        ...bookReadOnPageBeforeLast,
        readingStateCurrentBookmarkLocation: LAST_PAGE.cfi,
        readingStateCurrentBookmarkLocationUpdatedAt:
          "2026-01-01T00:00:00.000Z",
        readingStateCurrentBookmarkProgressPercent:
          LAST_PAGE.percentageEstimateOfBook,
      }
      const onBookmarkMoved = observeMovedBookmarks()
      const reader = createFakeReader()
      renderSyncBookProgress()
      reader.navigation.readingPosition$.next(PAGE_BEFORE_LAST)
      await vi.advanceTimersByTimeAsync(1000)
      mocks.incrementalBookModify.mockImplementationOnce(
        async function writeAfterConflict({ mutationFn }) {
          mutationFn(bookReadOnPageBeforeLast)
          mocks.state.book = mutationFn(bookMovedToLastPageElsewhere)

          return mocks.toStoredDocument(mocks.state.book)
        },
      )

      reader.navigation.readingPosition$.next(LAST_PAGE)
      await vi.advanceTimersByTimeAsync(1000)

      expect(onBookmarkMoved).not.toHaveBeenCalled()
    })
  })
})
