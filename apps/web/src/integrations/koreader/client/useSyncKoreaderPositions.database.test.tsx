import { createBookDefaults, ReadingStateState } from "@oboku/shared"
import { cleanup, renderHook } from "@testing-library/react"
import { filter, firstValueFrom, map } from "rxjs"
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  onTestFinished,
  vi,
} from "vitest"
import type { Database } from "../../../rxdb/databases.shared"
import type { usePushKoreaderPosition } from "./usePushKoreaderPosition"

type KoreaderPositionPush = Parameters<
  ReturnType<typeof usePushKoreaderPosition>["mutateAsync"]
>[0]

const mocks = vi.hoisted(function createSyncKoreaderMocks() {
  const session: { database: unknown } = { database: undefined }

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

vi.mock("../../../rxdb/RxDbProvider", function mockRxDbProvider() {
  return {
    useDatabase: function useOpenedDatabase() {
      return { db: mocks.session.database }
    },
  }
})

vi.mock("../../../auth/useIsAuthenticated", function mockIsAuthenticated() {
  return { useIsAuthenticated: () => true }
})

import {
  clearActiveProfileId,
  setActiveProfileId,
} from "../../../profiles/active/activeProfileId"
import { dispatchBookmarkMoved } from "../../../reader/events"
import { createDatabase } from "../../../rxdb/databases.shared"
import { useSyncKoreaderPositions } from "./useSyncKoreaderPositions"

const KOREADER_SYNC_DEBOUNCE_MS = 3000
const KOREADER_DOCUMENT = "document-a"
const FIRST_MOVE_AT = "2026-10-20T08:00:00.000Z"
const SECOND_MOVE_AT = "2026-10-20T09:00:00.000Z"

const toBookmarkAt = (progress: string, movedAt: string) => ({
  readingStateCurrentState: ReadingStateState.Reading,
  readingStateCurrentBookmarkLocation: "epubcfi(/6/4!/4/2/1:0)",
  readingStateCurrentBookmarkLocationUpdatedAt: movedAt,
  readingStateCurrentBookmarkProgressPercent: 0.1,
  readingStateCurrentBookmarkKoreaderProgress: progress,
  readingStateCurrentBookmarkKoreaderDocument: KOREADER_DOCUMENT,
})

const openDatabase = async (name: string) => {
  const database = await firstValueFrom(createDatabase({ name }))

  mocks.session.database = database

  return database
}

const waitForWaitingMoveOf = (
  database: Database,
  bookId: string,
  isAwaitedMovedAt: (movedAt: string | undefined) => boolean,
) =>
  firstValueFrom(
    database.koreaderpush.find().$.pipe(
      map(function toMovedAtOfBook(waitingMoves) {
        return waitingMoves.find((waitingMove) => waitingMove.bookId === bookId)
          ?.movedAt
      }),
      filter(isAwaitedMovedAt),
    ),
  )

const nextPush = () => {
  const push = Promise.withResolvers<KoreaderPositionPush>()

  mocks.pushKoreaderPosition.mockImplementationOnce(
    async function answerPush(pushed) {
      push.resolve(pushed)
    },
  )

  return push.promise
}

const setOnLine = (onLine: boolean) => {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(onLine)
  window.dispatchEvent(new Event(onLine ? "online" : "offline"))
}

const renderSyncKoreaderPositions = () =>
  renderHook(function renderUseSyncKoreaderPositions() {
    useSyncKoreaderPositions()
  })

describe("useSyncKoreaderPositions, with the account's database", () => {
  let databaseName: string

  beforeEach(() => {
    // RxJS schedules debounces and retries with intervals and reads the time
    // from Date; RxDB waits on timeouts, which stay real.
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] })
    mocks.pushKoreaderPosition.mockReset()
    databaseName = `koreader-push-${crypto.randomUUID()}`
    setActiveProfileId("profile-1")
    setOnLine(true)
  })

  afterEach(() => {
    cleanup()
    clearActiveProfileId()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it("pushes at the next start a move recorded before oboku closed, then forgets it", async () => {
    const database = await openDatabase(databaseName)
    const book = await database.book.post({
      ...createBookDefaults(),
      ...toBookmarkAt("/body/DocFragment[2]/body/p[1]/text().0", FIRST_MOVE_AT),
    })
    setOnLine(false)
    const runBeforeClosing = renderSyncKoreaderPositions()
    dispatchBookmarkMoved({
      bookId: book._id,
      koreaderDocument: KOREADER_DOCUMENT,
      movedAt: FIRST_MOVE_AT,
    })
    await waitForWaitingMoveOf(
      database,
      book._id,
      (movedAt) => movedAt === FIRST_MOVE_AT,
    )
    runBeforeClosing.unmount()
    await database.close()

    const reopenedDatabase = await openDatabase(databaseName)
    onTestFinished(async function removeDatabase() {
      await reopenedDatabase.remove()
    })
    setOnLine(true)
    const pushed = nextPush()
    renderSyncKoreaderPositions()
    await waitForWaitingMoveOf(
      reopenedDatabase,
      book._id,
      (movedAt) => movedAt === FIRST_MOVE_AT,
    )
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    expect((await pushed).book).toMatchObject({
      _id: book._id,
      readingStateCurrentBookmarkLocationUpdatedAt: FIRST_MOVE_AT,
    })

    await waitForWaitingMoveOf(
      reopenedDatabase,
      book._id,
      (movedAt) => movedAt === undefined,
    )
  })

  it("pushes the next move of a book once its previous move was pushed and forgotten", async () => {
    const database = await openDatabase(databaseName)
    onTestFinished(async function removeDatabase() {
      await database.remove()
    })
    const book = await database.book.post({
      ...createBookDefaults(),
      ...toBookmarkAt("/body/DocFragment[2]/body/p[1]/text().0", FIRST_MOVE_AT),
    })
    renderSyncKoreaderPositions()
    const firstPush = nextPush()
    dispatchBookmarkMoved({
      bookId: book._id,
      koreaderDocument: KOREADER_DOCUMENT,
      movedAt: FIRST_MOVE_AT,
    })
    await waitForWaitingMoveOf(
      database,
      book._id,
      (movedAt) => movedAt === FIRST_MOVE_AT,
    )
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)
    await firstPush
    await waitForWaitingMoveOf(
      database,
      book._id,
      (movedAt) => movedAt === undefined,
    )

    await book.incrementalPatch(
      toBookmarkAt("/body/DocFragment[2]/body/p[9]/text().0", SECOND_MOVE_AT),
    )
    const secondPush = nextPush()
    dispatchBookmarkMoved({
      bookId: book._id,
      koreaderDocument: KOREADER_DOCUMENT,
      movedAt: SECOND_MOVE_AT,
    })
    await waitForWaitingMoveOf(
      database,
      book._id,
      (movedAt) => movedAt === SECOND_MOVE_AT,
    )
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    expect((await secondPush).book).toMatchObject({
      _id: book._id,
      readingStateCurrentBookmarkLocationUpdatedAt: SECOND_MOVE_AT,
    })
  })
})
