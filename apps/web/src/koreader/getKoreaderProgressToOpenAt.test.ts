import type { KoreaderSyncPositionDto } from "@oboku/shared"
import { describe, expect, it } from "vitest"
import { getOrCreateInstallationId } from "../common/browser"
import { getKoreaderProgressToOpenAt } from "./getKoreaderProgressToOpenAt"

const BOOKMARK_PROGRESS = "/body/DocFragment[3]/body/p[2]/text().0"
const SERVER_PROGRESS = "/body/DocFragment[9]/body/p[12]/text().4"
const BOOKMARK_MOVED_AT = "2026-10-20T08:00:00.000Z"

const bookmarkedBook = {
  readingStateCurrentBookmarkLocationUpdatedAt: BOOKMARK_MOVED_AT,
  readingStateCurrentBookmarkProgressPercent: 0.2,
  readingStateCurrentBookmarkKoreaderProgress: BOOKMARK_PROGRESS,
}

const createServerPosition = (
  position: Partial<KoreaderSyncPositionDto> = {},
): KoreaderSyncPositionDto => ({
  progress: SERVER_PROGRESS,
  percentage: 0.6,
  device: "Kobo",
  deviceId: "kobo-device",
  updatedAt: "2026-10-20T09:00:00.000Z",
  ...position,
})

describe("getKoreaderProgressToOpenAt", () => {
  it("opens at the server's position when another device left it after the bookmark moved", () => {
    expect(
      getKoreaderProgressToOpenAt({
        book: bookmarkedBook,
        serverPosition: createServerPosition(),
      }),
    ).toBe(SERVER_PROGRESS)
  })

  it("opens at the bookmark when the server keeps no position", () => {
    expect(
      getKoreaderProgressToOpenAt({
        book: bookmarkedBook,
        serverPosition: undefined,
      }),
    ).toBeUndefined()
  })

  it("opens at the bookmark when it moved after the server received its position", () => {
    expect(
      getKoreaderProgressToOpenAt({
        book: bookmarkedBook,
        serverPosition: createServerPosition({
          updatedAt: "2026-10-20T07:00:00.000Z",
        }),
      }),
    ).toBeUndefined()
  })

  it("opens at the bookmark when this installation pushed the server's position", () => {
    expect(
      getKoreaderProgressToOpenAt({
        book: bookmarkedBook,
        serverPosition: createServerPosition({
          deviceId: getOrCreateInstallationId(),
        }),
      }),
    ).toBeUndefined()
  })

  it("opens at the bookmark when the server's position is the bookmark's place", () => {
    expect(
      getKoreaderProgressToOpenAt({
        book: bookmarkedBook,
        serverPosition: createServerPosition({ progress: BOOKMARK_PROGRESS }),
      }),
    ).toBeUndefined()
  })

  it("opens at the server's position when the bookmark was never dated", () => {
    expect(
      getKoreaderProgressToOpenAt({
        book: {
          ...bookmarkedBook,
          readingStateCurrentBookmarkLocationUpdatedAt: null,
        },
        serverPosition: createServerPosition({
          updatedAt: "2026-10-20T07:00:00.000Z",
        }),
      }),
    ).toBe(SERVER_PROGRESS)
  })

  it("opens at the server's undated position only when it is further than the bookmark", () => {
    const openAtUndatedPosition = (percentage: number) =>
      getKoreaderProgressToOpenAt({
        book: bookmarkedBook,
        serverPosition: createServerPosition({ updatedAt: null, percentage }),
      })

    expect(openAtUndatedPosition(0.6)).toBe(SERVER_PROGRESS)
    expect(openAtUndatedPosition(0.1)).toBeUndefined()
  })
})
