import {
  type BookDocType,
  createBookDefaults,
  ReadingStateState,
} from "@oboku/shared"
import { cleanup, renderHook } from "@testing-library/react"
import type { DeepReadonly } from "rxdb"
import { BehaviorSubject, map } from "rxjs"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { KoreaderPushDocType } from "../../rxdb/collections/koreaderPush"

type KoreaderPositionPush = {
  book: DeepReadonly<BookDocType>
  signal: AbortSignal
}

const mocks = vi.hoisted(function createSyncKoreaderMocks() {
  return {
    pushKoreaderPosition: vi.fn(async function pushToFakeServer(
      _push: KoreaderPositionPush,
    ) {}),
    session: {
      database: undefined as unknown,
      isAuthenticated: true,
    },
  }
})

vi.mock("./usePushKoreaderPosition", function mockPushKoreaderPosition() {
  return {
    usePushKoreaderPosition: function useMockPushKoreaderPosition() {
      return { mutateAsync: mocks.pushKoreaderPosition }
    },
  }
})

vi.mock("../../rxdb/RxDbProvider", function mockRxDbProvider() {
  return {
    useDatabase: function useFakeDatabase() {
      return { db: mocks.session.database }
    },
  }
})

vi.mock("../../auth/useIsAuthenticated", function mockIsAuthenticated() {
  return {
    useIsAuthenticated: function useFakeIsAuthenticated() {
      return mocks.session.isAuthenticated
    },
  }
})

import { dispatchBookmarkMoved } from "../../reader/events"
import { useSyncKoreaderPositions } from "./useSyncKoreaderPositions"

const KOREADER_SYNC_DEBOUNCE_MS = 3000
const PUSH_RETRY_DELAY_MS = 1000
const PUSH_RETRY_MAX_DELAY_MS = 5 * 60 * 1000

type KoreaderPlace = {
  document: string
  progress: string | null
  percentage: number
}

const BOOK_A_PLACE: KoreaderPlace = {
  document: "document-a",
  progress: "/body/DocFragment[2]/body/p[1]/text().0",
  percentage: 0.1,
}
const BOOK_A_LATER_PLACE: KoreaderPlace = {
  ...BOOK_A_PLACE,
  progress: "/body/DocFragment[2]/body/p[9]/text().0",
  percentage: 0.2,
}
const BOOK_B_PLACE: KoreaderPlace = {
  document: "document-b",
  progress: "12",
  percentage: 0.5,
}

const toBookId = ({ document }: KoreaderPlace) => `book-of-${document}`

const toFakeDocument = <Data extends { _id: string }>(data: Data) => ({
  primary: data._id,
  toJSON: function readFakeDocument() {
    return data
  },
})

/** The account's database, with the two collections the push reads and writes. */
const createFakeDatabase = () => {
  const books = new Map<string, BookDocType>()
  const koreaderPushes$ = new BehaviorSubject<
    ReadonlyMap<string, KoreaderPushDocType>
  >(new Map())

  const writeKoreaderPush = (koreaderPush: KoreaderPushDocType) => {
    koreaderPushes$.next(
      new Map(koreaderPushes$.getValue()).set(koreaderPush._id, koreaderPush),
    )
  }

  const database = {
    book: {
      findOne: function findFakeBook(bookId: string) {
        return {
          exec: async function execFindFakeBook() {
            const book = books.get(bookId)

            return book ? toFakeDocument(book) : null
          },
        }
      },
    },
    koreaderpush: {
      incrementalUpsert: vi.fn(async function upsertFakeKoreaderPush(
        koreaderPush: KoreaderPushDocType,
      ) {
        writeKoreaderPush(koreaderPush)
      }),
      find: function findFakeKoreaderPushes() {
        return {
          $: koreaderPushes$.pipe(
            map(function toFakeDocuments(koreaderPushes) {
              return [...koreaderPushes.values()].map(toFakeDocument)
            }),
          ),
        }
      },
      findOne: function findFakeKoreaderPush(bookId: string) {
        return {
          incrementalPatch: async function patchFakeKoreaderPush(
            patch: Partial<KoreaderPushDocType>,
          ) {
            const koreaderPush = koreaderPushes$.getValue().get(bookId)

            if (koreaderPush) writeKoreaderPush({ ...koreaderPush, ...patch })
          },
        }
      },
    },
  }

  return {
    database,
    books,
    getKoreaderPush: (bookId: string) => koreaderPushes$.getValue().get(bookId),
    writeKoreaderPush,
  }
}

type FakeDatabase = ReturnType<typeof createFakeDatabase>

let moveCount = 0

const nextMoveTime = () => {
  moveCount += 1

  return new Date(Date.now() + moveCount).toISOString()
}

const toBookAt = (place: KoreaderPlace, movedAt: string): BookDocType => ({
  ...createBookDefaults(),
  _id: toBookId(place),
  _rev: "2-book",
  rx_model: "book",
  rxdbMeta: { lwt: 1 },
  readingStateCurrentState: ReadingStateState.Reading,
  readingStateCurrentBookmarkLocation: "epubcfi(/6/4!/4/2/1:0)",
  readingStateCurrentBookmarkLocationUpdatedAt: movedAt,
  readingStateCurrentBookmarkProgressPercent: place.percentage,
  readingStateCurrentBookmarkKoreaderProgress: place.progress,
  readingStateCurrentBookmarkKoreaderDocument: place.document,
})

/** The bookmark moves without reading on this device: replication, mark-as. */
const moveBookmarkElsewhere = (
  { books }: FakeDatabase,
  place: KoreaderPlace,
  movedAt = nextMoveTime(),
) => {
  const book = toBookAt(place, movedAt)

  books.set(book._id, book)

  return book
}

/** Reading on this device moves the bookmark, as the reader saves it. */
const moveBookmarkTo = (fakeDatabase: FakeDatabase, place: KoreaderPlace) => {
  const movedAt = nextMoveTime()
  const book = moveBookmarkElsewhere(fakeDatabase, place, movedAt)

  dispatchBookmarkMoved({ bookId: book._id, movedAt })

  return book
}

const toPushedBook = (book: BookDocType) => ({
  book,
  signal: expect.any(AbortSignal),
})

const holdNextPush = () => {
  const heldPush = Promise.withResolvers<void>()

  mocks.pushKoreaderPosition.mockImplementationOnce(function answerLater() {
    return heldPush.promise
  })

  return function answerHeldPush() {
    heldPush.resolve()
  }
}

const setOnLine = (onLine: boolean) => {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(onLine)
  window.dispatchEvent(new Event(onLine ? "online" : "offline"))
}

const toggleNetwork = () => {
  setOnLine(false)
  setOnLine(true)
}

const openDatabase = (fakeDatabase: FakeDatabase | undefined) => {
  mocks.session.database = fakeDatabase?.database
}

const renderSyncKoreaderPositions = () =>
  renderHook(function renderUseSyncKoreaderPositions() {
    useSyncKoreaderPositions()
  })

describe("useSyncKoreaderPositions", () => {
  let fakeDatabase: FakeDatabase

  beforeEach(() => {
    vi.useFakeTimers()
    mocks.pushKoreaderPosition.mockReset()
    mocks.session.isAuthenticated = true
    fakeDatabase = createFakeDatabase()
    openDatabase(fakeDatabase)
    setOnLine(true)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it("pushes the latest position once it has stayed put for a few seconds", async () => {
    renderSyncKoreaderPositions()
    moveBookmarkTo(fakeDatabase, BOOK_A_PLACE)
    await vi.advanceTimersByTimeAsync(1000)
    const latestBook = moveBookmarkTo(fakeDatabase, BOOK_A_LATER_PLACE)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS - 1)

    expect(mocks.pushKoreaderPosition).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)

    expect(mocks.pushKoreaderPosition).toHaveBeenCalledExactlyOnceWith(
      toPushedBook(latestBook),
    )
  })

  it("pushes a position only once, even when the network comes back", async () => {
    renderSyncKoreaderPositions()
    moveBookmarkTo(fakeDatabase, BOOK_A_PLACE)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    toggleNetwork()
    await vi.advanceTimersByTimeAsync(0)

    expect(mocks.pushKoreaderPosition).toHaveBeenCalledOnce()
  })

  it("pushes the latest position of each book", async () => {
    renderSyncKoreaderPositions()
    const bookA = moveBookmarkTo(fakeDatabase, BOOK_A_PLACE)
    const bookB = moveBookmarkTo(fakeDatabase, BOOK_B_PLACE)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    expect(mocks.pushKoreaderPosition).toHaveBeenCalledTimes(2)
    expect(mocks.pushKoreaderPosition).toHaveBeenCalledWith(toPushedBook(bookA))
    expect(mocks.pushKoreaderPosition).toHaveBeenCalledWith(toPushedBook(bookB))
  })

  it("waits for each book's position on its own, whatever happens in another book", async () => {
    renderSyncKoreaderPositions()
    const bookA = moveBookmarkTo(fakeDatabase, BOOK_A_PLACE)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS - 1000)
    moveBookmarkTo(fakeDatabase, BOOK_B_PLACE)
    await vi.advanceTimersByTimeAsync(1000)

    expect(mocks.pushKoreaderPosition).toHaveBeenCalledExactlyOnceWith(
      toPushedBook(bookA),
    )
  })

  it("pushes a position moved to while an older one of the same book was being pushed", async () => {
    const answerFirstPush = holdNextPush()
    renderSyncKoreaderPositions()
    moveBookmarkTo(fakeDatabase, BOOK_A_PLACE)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    const latestBook = moveBookmarkTo(fakeDatabase, BOOK_A_LATER_PLACE)
    answerFirstPush()
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    expect(mocks.pushKoreaderPosition).toHaveBeenCalledTimes(2)
    expect(mocks.pushKoreaderPosition).toHaveBeenLastCalledWith(
      toPushedBook(latestBook),
    )
  })

  it("waits for the network, then pushes only the latest position of each book", async () => {
    setOnLine(false)
    renderSyncKoreaderPositions()
    moveBookmarkTo(fakeDatabase, BOOK_A_PLACE)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)
    const latestBook = moveBookmarkTo(fakeDatabase, BOOK_A_LATER_PLACE)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    expect(mocks.pushKoreaderPosition).not.toHaveBeenCalled()

    setOnLine(true)
    await vi.advanceTimersByTimeAsync(0)

    expect(mocks.pushKoreaderPosition).toHaveBeenCalledExactlyOnceWith(
      toPushedBook(latestBook),
    )
  })

  it("hands the push only the latest move of a book, even one KOReader cannot open", async () => {
    setOnLine(false)
    renderSyncKoreaderPositions()
    moveBookmarkTo(fakeDatabase, BOOK_A_PLACE)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)
    const latestBook = moveBookmarkTo(fakeDatabase, {
      ...BOOK_A_LATER_PLACE,
      progress: null,
    })
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    setOnLine(true)
    await vi.advanceTimersByTimeAsync(0)

    expect(mocks.pushKoreaderPosition).toHaveBeenCalledExactlyOnceWith(
      toPushedBook(latestBook),
    )
  })

  it("pushes a position again a second after its push failed, then twice as long after each failure", async () => {
    mocks.pushKoreaderPosition
      .mockRejectedValueOnce(new Error("unreachable"))
      .mockRejectedValueOnce(new Error("unreachable"))
    renderSyncKoreaderPositions()
    const book = moveBookmarkTo(fakeDatabase, BOOK_A_PLACE)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)
    await vi.advanceTimersByTimeAsync(PUSH_RETRY_DELAY_MS - 1)

    expect(mocks.pushKoreaderPosition).toHaveBeenCalledOnce()

    await vi.advanceTimersByTimeAsync(1)

    expect(mocks.pushKoreaderPosition).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(2 * PUSH_RETRY_DELAY_MS - 1)

    expect(mocks.pushKoreaderPosition).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(1)

    expect(mocks.pushKoreaderPosition).toHaveBeenCalledTimes(3)
    expect(mocks.pushKoreaderPosition).toHaveBeenLastCalledWith(
      toPushedBook(book),
    )
  })

  it("waits for the device to be back online to push a failed position again", async () => {
    mocks.pushKoreaderPosition.mockRejectedValueOnce(new Error("unreachable"))
    renderSyncKoreaderPositions()
    moveBookmarkTo(fakeDatabase, BOOK_A_PLACE)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)
    setOnLine(false)
    await vi.advanceTimersByTimeAsync(PUSH_RETRY_MAX_DELAY_MS)

    expect(mocks.pushKoreaderPosition).toHaveBeenCalledOnce()

    setOnLine(true)
    await vi.advanceTimersByTimeAsync(0)

    expect(mocks.pushKoreaderPosition).toHaveBeenCalledTimes(2)
  })

  it("pushes at start a move oboku closed before pushing", async () => {
    const movedAt = nextMoveTime()
    const book = moveBookmarkElsewhere(fakeDatabase, BOOK_A_PLACE, movedAt)
    fakeDatabase.writeKoreaderPush({ _id: book._id, movedAt })

    renderSyncKoreaderPositions()
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    expect(mocks.pushKoreaderPosition).toHaveBeenCalledExactlyOnceWith(
      toPushedBook(book),
    )
  })

  it("does not push a move again at the next start once it was pushed", async () => {
    const { unmount } = renderSyncKoreaderPositions()
    moveBookmarkTo(fakeDatabase, BOOK_A_PLACE)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)
    unmount()

    renderSyncKoreaderPositions()
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    expect(mocks.pushKoreaderPosition).toHaveBeenCalledOnce()
  })

  it("does not push a move the bookmark has moved on from, and lets it go", async () => {
    setOnLine(false)
    renderSyncKoreaderPositions()
    const movedBook = moveBookmarkTo(fakeDatabase, BOOK_A_PLACE)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)
    moveBookmarkElsewhere(fakeDatabase, BOOK_A_LATER_PLACE)

    setOnLine(true)
    await vi.advanceTimersByTimeAsync(0)

    expect(mocks.pushKoreaderPosition).not.toHaveBeenCalled()
    expect(fakeDatabase.getKoreaderPush(movedBook._id)).toEqual({
      _id: movedBook._id,
      movedAt: movedBook.readingStateCurrentBookmarkLocationUpdatedAt,
      handledMovedAt: movedBook.readingStateCurrentBookmarkLocationUpdatedAt,
    })
  })

  it("waits for the account to be signed in again to push", async () => {
    mocks.session.isAuthenticated = false
    const { rerender } = renderSyncKoreaderPositions()
    const book = moveBookmarkTo(fakeDatabase, BOOK_A_PLACE)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    expect(mocks.pushKoreaderPosition).not.toHaveBeenCalled()

    mocks.session.isAuthenticated = true
    rerender()
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    expect(mocks.pushKoreaderPosition).toHaveBeenCalledExactlyOnceWith(
      toPushedBook(book),
    )
  })

  it("abandons a push in flight and pushes nothing more once the account's database goes", async () => {
    holdNextPush()
    const { rerender } = renderSyncKoreaderPositions()
    moveBookmarkTo(fakeDatabase, BOOK_A_PLACE)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)
    moveBookmarkTo(fakeDatabase, BOOK_B_PLACE)

    openDatabase(undefined)
    rerender()
    openDatabase(createFakeDatabase())
    rerender()
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    expect(mocks.pushKoreaderPosition).toHaveBeenCalledOnce()
    expect(mocks.pushKoreaderPosition.mock.lastCall?.[0].signal.aborted).toBe(
      true,
    )
  })

  it("keeps recording moves after one fails to record", async () => {
    vi.spyOn(console, "error").mockImplementation(function ignoreError() {})
    fakeDatabase.database.koreaderpush.incrementalUpsert.mockRejectedValueOnce(
      new Error("quota exceeded"),
    )
    renderSyncKoreaderPositions()
    moveBookmarkTo(fakeDatabase, BOOK_A_PLACE)
    const bookB = moveBookmarkTo(fakeDatabase, BOOK_B_PLACE)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    expect(mocks.pushKoreaderPosition).toHaveBeenCalledExactlyOnceWith(
      toPushedBook(bookB),
    )
  })

  it("stops pushing once unmounted", async () => {
    const { unmount } = renderSyncKoreaderPositions()
    moveBookmarkTo(fakeDatabase, BOOK_A_PLACE)
    unmount()
    moveBookmarkTo(fakeDatabase, BOOK_B_PLACE)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    expect(mocks.pushKoreaderPosition).not.toHaveBeenCalled()
  })
})
