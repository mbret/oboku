import {
  type BookDocType,
  createBookDefaults,
  ReadingStateState,
} from "@oboku/shared"
import { cleanup, renderHook } from "@testing-library/react"
import { BehaviorSubject, map } from "rxjs"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { KoreaderPushDocType } from "../../rxdb/collections/koreaderPush"
import type { usePushKoreaderPosition } from "./usePushKoreaderPosition"

type KoreaderPositionPush = Parameters<
  ReturnType<typeof usePushKoreaderPosition>["mutateAsync"]
>[0]

const mocks = vi.hoisted(function createSyncKoreaderMocks() {
  const session: { database: unknown; isAuthenticated: boolean } = {
    database: undefined,
    isAuthenticated: true,
  }

  return {
    pushKoreaderPosition: vi.fn(async function pushToFakeServer(
      _push: KoreaderPositionPush,
    ) {}),
    session,
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

import {
  clearActiveProfileId,
  setActiveProfileId,
} from "../../profiles/active/activeProfileId"
import { dispatchBookmarkMoved } from "../../reader/events"
import { useSyncKoreaderPositions } from "./useSyncKoreaderPositions"

const PROFILE_ID = "profile-1"
const OTHER_PROFILE_ID = "profile-2"
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
  ...data,
  primary: data._id,
  toJSON: function readFakeDocument() {
    return data
  },
})

const createFakeDatabase = () => {
  const books = new Map<string, BookDocType>()
  const waitingMoves$ = new BehaviorSubject<
    ReadonlyMap<string, KoreaderPushDocType>
  >(new Map())

  const writeWaitingMove = (waitingMove: KoreaderPushDocType) => {
    waitingMoves$.next(
      new Map(waitingMoves$.getValue()).set(waitingMove._id, waitingMove),
    )
  }

  const deleteWaitingMove = (bookId: string) => {
    const waitingMoves = new Map(waitingMoves$.getValue())

    waitingMoves.delete(bookId)
    waitingMoves$.next(waitingMoves)
  }

  const database = {
    collections: {
      book: {
        findOne: function findFakeBook({
          selector,
        }: {
          selector: { _id: string }
        }) {
          return {
            exec: async function execFindFakeBook() {
              const book = books.get(selector._id)

              return book ? toFakeDocument(book) : null
            },
          }
        },
      },
    },
    koreaderpush: {
      incrementalUpsert: vi.fn(async function upsertFakeWaitingMove(
        waitingMove: KoreaderPushDocType,
      ) {
        writeWaitingMove(waitingMove)
      }),
      find: function findFakeWaitingMoves() {
        return {
          $: waitingMoves$.pipe(
            map(function toFakeDocuments(waitingMoves) {
              return [...waitingMoves.values()].map(toFakeDocument)
            }),
          ),
        }
      },
      findOne: function findFakeWaitingMove(bookId: string) {
        return {
          incrementalModify: async function modifyFakeWaitingMove(
            modify: (
              waitingMove: KoreaderPushDocType & { _deleted: boolean },
            ) => KoreaderPushDocType & { _deleted?: boolean },
          ) {
            const waitingMove = waitingMoves$.getValue().get(bookId)

            if (!waitingMove) return

            const { _deleted, ...modified } = modify({
              ...waitingMove,
              _deleted: false,
            })

            if (_deleted) {
              deleteWaitingMove(bookId)
            } else {
              writeWaitingMove(modified)
            }
          },
        }
      },
    },
  }

  return {
    database,
    books,
    getWaitingMove: (bookId: string) => waitingMoves$.getValue().get(bookId),
    writeWaitingMove,
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

const storeBookAt = (
  { books }: FakeDatabase,
  place: KoreaderPlace,
  movedAt = nextMoveTime(),
) => {
  const book = toBookAt(place, movedAt)

  books.set(book._id, book)

  return book
}

const moveBookmarkTo = (fakeDatabase: FakeDatabase, place: KoreaderPlace) => {
  const movedAt = nextMoveTime()
  const book = storeBookAt(fakeDatabase, place, movedAt)

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

const getLastPushSignal = () =>
  mocks.pushKoreaderPosition.mock.lastCall?.[0].signal

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
    setActiveProfileId(PROFILE_ID)
    setOnLine(true)
  })

  afterEach(() => {
    cleanup()
    clearActiveProfileId()
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

  it("keeps, then pushes, a position moved to while an older one of the same book was being pushed", async () => {
    const answerFirstPush = holdNextPush()
    renderSyncKoreaderPositions()
    moveBookmarkTo(fakeDatabase, BOOK_A_PLACE)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    const latestBook = moveBookmarkTo(fakeDatabase, BOOK_A_LATER_PLACE)
    answerFirstPush()
    await vi.advanceTimersByTimeAsync(0)

    expect(fakeDatabase.getWaitingMove(latestBook._id)?.movedAt).toBe(
      latestBook.readingStateCurrentBookmarkLocationUpdatedAt,
    )

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
    vi.spyOn(console, "error").mockImplementation(function ignoreError() {})
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
    vi.spyOn(console, "error").mockImplementation(function ignoreError() {})
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
    const book = storeBookAt(fakeDatabase, BOOK_A_PLACE, movedAt)
    fakeDatabase.writeWaitingMove({
      _id: book._id,
      profileId: PROFILE_ID,
      movedAt,
    })

    renderSyncKoreaderPositions()
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    expect(mocks.pushKoreaderPosition).toHaveBeenCalledExactlyOnceWith(
      toPushedBook(book),
    )
  })

  it("forgets a pushed move, so the next start does not push it again", async () => {
    const { unmount } = renderSyncKoreaderPositions()
    const book = moveBookmarkTo(fakeDatabase, BOOK_A_PLACE)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)
    unmount()

    expect(fakeDatabase.getWaitingMove(book._id)).toBeUndefined()

    renderSyncKoreaderPositions()
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    expect(mocks.pushKoreaderPosition).toHaveBeenCalledOnce()
  })

  it("forgets without pushing a move the bookmark has moved on from", async () => {
    setOnLine(false)
    renderSyncKoreaderPositions()
    const movedBook = moveBookmarkTo(fakeDatabase, BOOK_A_PLACE)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)
    storeBookAt(fakeDatabase, BOOK_A_LATER_PLACE)

    setOnLine(true)
    await vi.advanceTimersByTimeAsync(0)

    expect(mocks.pushKoreaderPosition).not.toHaveBeenCalled()
    expect(fakeDatabase.getWaitingMove(movedBook._id)).toBeUndefined()
  })

  it("does not push a move made under another profile", async () => {
    const movedAt = nextMoveTime()
    const book = storeBookAt(fakeDatabase, BOOK_A_PLACE, movedAt)
    fakeDatabase.writeWaitingMove({
      _id: book._id,
      profileId: OTHER_PROFILE_ID,
      movedAt,
    })

    renderSyncKoreaderPositions()
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    expect(mocks.pushKoreaderPosition).not.toHaveBeenCalled()
  })

  it("abandons a push in flight, and pushes nothing more, once the active profile changes", async () => {
    holdNextPush()
    renderSyncKoreaderPositions()
    moveBookmarkTo(fakeDatabase, BOOK_A_PLACE)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)
    moveBookmarkTo(fakeDatabase, BOOK_B_PLACE)

    setActiveProfileId(OTHER_PROFILE_ID)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    expect(mocks.pushKoreaderPosition).toHaveBeenCalledOnce()
    expect(getLastPushSignal()?.aborted).toBe(true)
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

  it("abandons a push in flight, and pushes nothing more, once the account's database goes", async () => {
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
    expect(getLastPushSignal()?.aborted).toBe(true)
  })

  it("keeps recording moves after one fails to record", async () => {
    vi.spyOn(console, "error").mockImplementation(function ignoreError() {})
    fakeDatabase.database.koreaderpush.incrementalUpsert.mockImplementationOnce(
      function failToWrite() {
        throw new Error("collection closed")
      },
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
