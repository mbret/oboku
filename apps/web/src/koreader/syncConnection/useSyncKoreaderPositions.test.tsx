import {
  type BookDocType,
  createBookDefaults,
  type KoreaderSyncConnectionPushPositionData,
  ReadingStateState,
} from "@oboku/shared"
import { cleanup, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(function createSyncKoreaderMocks() {
  return {
    pushKoreaderPosition: vi.fn(async function pushToFakeServer(
      _position: KoreaderSyncConnectionPushPositionData["body"],
    ) {}),
  }
})

vi.mock("./usePushKoreaderPosition", function mockPushKoreaderPosition() {
  return {
    usePushKoreaderPosition: function useMockPushKoreaderPosition() {
      return { mutateAsync: mocks.pushKoreaderPosition }
    },
  }
})

import { getOrCreateInstallationId } from "../../common/browser"
import {
  clearActiveProfileId,
  setActiveProfileId,
} from "../../profiles/active/activeProfileId"
import { dispatchBookmarkMoved } from "../../reader/events"
import { useSyncKoreaderPositions } from "./useSyncKoreaderPositions"

type KoreaderPosition = Omit<
  KoreaderSyncConnectionPushPositionData["body"],
  "deviceId"
>

const PROFILE_ID = "profile-1"
const KOREADER_SYNC_DEBOUNCE_MS = 3000

const BOOK_A_POSITION: KoreaderPosition = {
  document: "document-a",
  progress: "/body/DocFragment[2]/body/p[1]/text().0",
  percentage: 0.1,
}
const BOOK_A_LATER_POSITION: KoreaderPosition = {
  ...BOOK_A_POSITION,
  progress: "/body/DocFragment[2]/body/p[9]/text().0",
  percentage: 0.2,
}
const BOOK_B_POSITION: KoreaderPosition = {
  document: "document-b",
  progress: "12",
  percentage: 0.5,
}

const moveBookmarkTo = ({
  document,
  progress,
  percentage,
}: {
  document: string
  progress: string | null
  percentage: number
}) => {
  const movedBook: BookDocType = {
    ...createBookDefaults(),
    _id: `book-of-${document}`,
    _rev: "2-book",
    rx_model: "book",
    rxdbMeta: { lwt: 1 },
    readingStateCurrentState: ReadingStateState.Reading,
    readingStateCurrentBookmarkLocation: "epubcfi(/6/4!/4/2/1:0)",
    readingStateCurrentBookmarkLocationUpdatedAt: new Date().toISOString(),
    readingStateCurrentBookmarkProgressPercent: percentage,
    readingStateCurrentBookmarkKoreaderProgress: progress,
    readingStateCurrentBookmarkKoreaderDocument: document,
  }

  dispatchBookmarkMoved(movedBook)
}

const toPushedPosition = (position: KoreaderPosition) => ({
  ...position,
  deviceId: getOrCreateInstallationId(),
})

const holdNextPush = () => {
  const { promise: heldPush, resolve: answerHeldPush } =
    Promise.withResolvers<void>()

  mocks.pushKoreaderPosition.mockImplementationOnce(function answerLater() {
    return heldPush
  })

  return answerHeldPush
}

const setOnLine = (onLine: boolean) => {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(onLine)
  window.dispatchEvent(new Event(onLine ? "online" : "offline"))
}

const toggleNetwork = () => {
  setOnLine(false)
  setOnLine(true)
}

const renderSyncKoreaderPositions = () =>
  renderHook(function renderUseSyncKoreaderPositions() {
    useSyncKoreaderPositions()
  })

describe("useSyncKoreaderPositions", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mocks.pushKoreaderPosition.mockReset()
    setOnLine(true)
    setActiveProfileId(PROFILE_ID)
  })

  afterEach(() => {
    cleanup()
    clearActiveProfileId()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it("pushes the latest position once it has stayed put for a few seconds", async () => {
    renderSyncKoreaderPositions()
    moveBookmarkTo(BOOK_A_POSITION)
    await vi.advanceTimersByTimeAsync(1000)
    moveBookmarkTo(BOOK_A_LATER_POSITION)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS - 1)

    expect(mocks.pushKoreaderPosition).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)

    expect(mocks.pushKoreaderPosition).toHaveBeenCalledExactlyOnceWith(
      toPushedPosition(BOOK_A_LATER_POSITION),
    )
  })

  it("pushes a position only once, even when the network comes back", async () => {
    renderSyncKoreaderPositions()
    moveBookmarkTo(BOOK_A_POSITION)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    toggleNetwork()
    await vi.advanceTimersByTimeAsync(0)

    expect(mocks.pushKoreaderPosition).toHaveBeenCalledOnce()
  })

  it("pushes the latest position of each book", async () => {
    renderSyncKoreaderPositions()
    moveBookmarkTo(BOOK_A_POSITION)
    moveBookmarkTo(BOOK_B_POSITION)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    expect(mocks.pushKoreaderPosition).toHaveBeenCalledTimes(2)
    expect(mocks.pushKoreaderPosition).toHaveBeenNthCalledWith(
      1,
      toPushedPosition(BOOK_A_POSITION),
    )
    expect(mocks.pushKoreaderPosition).toHaveBeenNthCalledWith(
      2,
      toPushedPosition(BOOK_B_POSITION),
    )
  })

  it("waits for each book's position on its own, whatever happens in another book", async () => {
    renderSyncKoreaderPositions()
    moveBookmarkTo(BOOK_A_POSITION)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS - 1000)
    moveBookmarkTo(BOOK_B_POSITION)
    await vi.advanceTimersByTimeAsync(1000)

    expect(mocks.pushKoreaderPosition).toHaveBeenCalledExactlyOnceWith(
      toPushedPosition(BOOK_A_POSITION),
    )
  })

  it("pushes a position moved to while an older one of the same book was being pushed", async () => {
    const answerFirstPush = holdNextPush()
    renderSyncKoreaderPositions()
    moveBookmarkTo(BOOK_A_POSITION)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    moveBookmarkTo(BOOK_A_LATER_POSITION)
    answerFirstPush()
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    expect(mocks.pushKoreaderPosition).toHaveBeenCalledTimes(2)
    expect(mocks.pushKoreaderPosition).toHaveBeenLastCalledWith(
      toPushedPosition(BOOK_A_LATER_POSITION),
    )
  })

  it("waits for the network, then pushes only the latest position of each book", async () => {
    setOnLine(false)
    renderSyncKoreaderPositions()
    moveBookmarkTo(BOOK_A_POSITION)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)
    moveBookmarkTo(BOOK_A_LATER_POSITION)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    expect(mocks.pushKoreaderPosition).not.toHaveBeenCalled()

    setOnLine(true)
    await vi.advanceTimersByTimeAsync(0)

    expect(mocks.pushKoreaderPosition).toHaveBeenCalledExactlyOnceWith(
      toPushedPosition(BOOK_A_LATER_POSITION),
    )
  })

  it("pushes a position again after its push failed", async () => {
    mocks.pushKoreaderPosition.mockRejectedValueOnce(new Error("unreachable"))
    renderSyncKoreaderPositions()
    moveBookmarkTo(BOOK_A_POSITION)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    expect(mocks.pushKoreaderPosition).toHaveBeenCalledOnce()

    await vi.advanceTimersByTimeAsync(1)

    expect(mocks.pushKoreaderPosition).toHaveBeenCalledTimes(2)
    expect(mocks.pushKoreaderPosition).toHaveBeenLastCalledWith(
      toPushedPosition(BOOK_A_POSITION),
    )
  })

  it("drops the waiting position of a book whose bookmark moves somewhere KOReader cannot open", async () => {
    renderSyncKoreaderPositions()
    moveBookmarkTo(BOOK_A_POSITION)
    moveBookmarkTo({ ...BOOK_A_LATER_POSITION, progress: null })
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    expect(mocks.pushKoreaderPosition).not.toHaveBeenCalled()
  })

  it("does not push a position moved to before the profile changed", async () => {
    renderSyncKoreaderPositions()
    moveBookmarkTo(BOOK_A_POSITION)
    setActiveProfileId("profile-2")
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    expect(mocks.pushKoreaderPosition).not.toHaveBeenCalled()
  })

  it("stops pushing once unmounted", async () => {
    const { unmount } = renderSyncKoreaderPositions()
    moveBookmarkTo(BOOK_A_POSITION)
    unmount()
    moveBookmarkTo(BOOK_B_POSITION)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    expect(mocks.pushKoreaderPosition).not.toHaveBeenCalled()
  })
})
