import type { KoreaderSyncConnectionPushPositionData } from "@oboku/shared"
import { cleanup, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = await vi.hoisted(async function createSyncKoreaderMocks() {
  const { BehaviorSubject } = await import("rxjs")

  return {
    onLine$: new BehaviorSubject(true),
    pushKoreaderPosition: vi.fn(async function pushToFakeServer(
      _position: KoreaderSyncConnectionPushPositionData["body"],
    ) {}),
  }
})

vi.mock("../../common/network/onLine", function mockOnLine() {
  return { navigatorOnLine$: mocks.onLine$ }
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
import {
  type KoreaderPositionToPush,
  koreaderPositionsToPushSignal,
} from "./koreaderPositionsToPush"
import { useSyncKoreaderPositions } from "./useSyncKoreaderPositions"

const PROFILE_ID = "profile-1"
const KOREADER_SYNC_DEBOUNCE_MS = 3000

const BOOK_A_POSITION: KoreaderPositionToPush = {
  document: "document-a",
  progress: "/body/DocFragment[2]/body/p[1]/text().0",
  percentage: 0.1,
}
const BOOK_A_LATER_POSITION: KoreaderPositionToPush = {
  ...BOOK_A_POSITION,
  progress: "/body/DocFragment[2]/body/p[9]/text().0",
  percentage: 0.2,
}
const BOOK_B_POSITION: KoreaderPositionToPush = {
  document: "document-b",
  progress: "12",
  percentage: 0.5,
}

const recordPosition = (
  position: KoreaderPositionToPush,
  profileId = PROFILE_ID,
) => {
  koreaderPositionsToPushSignal.update(
    function withPosition(positionsByProfile) {
      return {
        ...positionsByProfile,
        [profileId]: {
          ...positionsByProfile[profileId],
          [position.document]: position,
        },
      }
    },
  )
}

const getRecordedPositions = () =>
  koreaderPositionsToPushSignal.getValue()[PROFILE_ID]

const toPushedPosition = (position: KoreaderPositionToPush) => ({
  ...position,
  deviceId: getOrCreateInstallationId(),
})

const holdNextPush = () => {
  let answerPush = () => {}

  mocks.pushKoreaderPosition.mockImplementationOnce(function answerLater() {
    return new Promise<void>(function waitForAnswer(resolve) {
      answerPush = resolve
    })
  })

  return function answerHeldPush() {
    answerPush()
  }
}

const renderSyncKoreaderPositions = () =>
  renderHook(function renderUseSyncKoreaderPositions() {
    useSyncKoreaderPositions()
  })

describe("useSyncKoreaderPositions", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mocks.pushKoreaderPosition.mockReset()
    mocks.onLine$.next(true)
    koreaderPositionsToPushSignal.setValue({})
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
    recordPosition(BOOK_A_POSITION)
    await vi.advanceTimersByTimeAsync(1000)
    recordPosition(BOOK_A_LATER_POSITION)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS - 1)

    expect(mocks.pushKoreaderPosition).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)

    expect(mocks.pushKoreaderPosition).toHaveBeenCalledExactlyOnceWith(
      toPushedPosition(BOOK_A_LATER_POSITION),
    )
  })

  it("forgets a position once it is pushed", async () => {
    renderSyncKoreaderPositions()
    recordPosition(BOOK_A_POSITION)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    expect(getRecordedPositions()).toEqual({})
  })

  it("pushes the positions of several books one after another", async () => {
    const answerFirstPush = holdNextPush()
    renderSyncKoreaderPositions()
    recordPosition(BOOK_A_POSITION)
    recordPosition(BOOK_B_POSITION)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    expect(mocks.pushKoreaderPosition).toHaveBeenCalledExactlyOnceWith(
      toPushedPosition(BOOK_A_POSITION),
    )

    answerFirstPush()
    await vi.advanceTimersByTimeAsync(0)

    expect(mocks.pushKoreaderPosition).toHaveBeenLastCalledWith(
      toPushedPosition(BOOK_B_POSITION),
    )
  })

  it("keeps a position recorded while an older one of the same book was being pushed", async () => {
    const answerFirstPush = holdNextPush()
    renderSyncKoreaderPositions()
    recordPosition(BOOK_A_POSITION)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    recordPosition(BOOK_A_LATER_POSITION)
    answerFirstPush()
    await vi.advanceTimersByTimeAsync(0)

    expect(getRecordedPositions()).toEqual({
      [BOOK_A_POSITION.document]: BOOK_A_LATER_POSITION,
    })

    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    expect(mocks.pushKoreaderPosition).toHaveBeenLastCalledWith(
      toPushedPosition(BOOK_A_LATER_POSITION),
    )
  })

  it("waits for the network, then pushes only the latest position of each book", async () => {
    mocks.onLine$.next(false)
    renderSyncKoreaderPositions()
    recordPosition(BOOK_A_POSITION)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)
    recordPosition(BOOK_A_LATER_POSITION)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    expect(mocks.pushKoreaderPosition).not.toHaveBeenCalled()

    mocks.onLine$.next(true)
    await vi.advanceTimersByTimeAsync(0)

    expect(mocks.pushKoreaderPosition).toHaveBeenCalledExactlyOnceWith(
      toPushedPosition(BOOK_A_LATER_POSITION),
    )
  })

  it("keeps a position whose push failed, and pushes it when the network comes back", async () => {
    mocks.pushKoreaderPosition.mockRejectedValueOnce(new Error("unreachable"))
    vi.spyOn(console, "error").mockImplementation(function silence() {})
    renderSyncKoreaderPositions()
    recordPosition(BOOK_A_POSITION)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    expect(getRecordedPositions()).toEqual({
      [BOOK_A_POSITION.document]: BOOK_A_POSITION,
    })

    mocks.onLine$.next(false)
    mocks.onLine$.next(true)
    await vi.advanceTimersByTimeAsync(0)

    expect(mocks.pushKoreaderPosition).toHaveBeenCalledTimes(2)
    expect(getRecordedPositions()).toEqual({})
  })

  it("does not push the positions of another profile", async () => {
    renderSyncKoreaderPositions()
    recordPosition(BOOK_A_POSITION, "profile-2")
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    expect(mocks.pushKoreaderPosition).not.toHaveBeenCalled()
  })

  it("stops pushing once unmounted", async () => {
    const { unmount } = renderSyncKoreaderPositions()
    unmount()
    recordPosition(BOOK_A_POSITION)
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_DEBOUNCE_MS)

    expect(mocks.pushKoreaderPosition).not.toHaveBeenCalled()
  })
})
