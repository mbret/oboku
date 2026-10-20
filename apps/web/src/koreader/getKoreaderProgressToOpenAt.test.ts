import type { BookKoreaderSyncPosition } from "@oboku/shared"
import { describe, expect, it } from "vitest"
import { getOrCreateInstallationId } from "../common/browser"
import { getKoreaderProgressToOpenAt } from "./getKoreaderProgressToOpenAt"

const KOREADER_DOCUMENT = "8f3a9c1e0b7d4f2a6c5e1d0b9a8f7e6d"
const BOOKMARK_PROGRESS = "/body/DocFragment[3]/body/p[2]/text().0"
const SERVER_PROGRESS = "/body/DocFragment[9]/body/p[12]/text().4"
const BOOKMARK_MOVED_AT = "2026-10-20T08:00:00.000Z"

const bookmarkedBook = {
  readingStateCurrentBookmarkLocationUpdatedAt: BOOKMARK_MOVED_AT,
  readingStateCurrentBookmarkProgressPercent: 0.2,
  readingStateCurrentBookmarkKoreaderProgress: BOOKMARK_PROGRESS,
  readingStateKoreaderSyncPosition: null,
}

const createServerPosition = (
  position: Partial<BookKoreaderSyncPosition> = {},
): BookKoreaderSyncPosition => ({
  document: KOREADER_DOCUMENT,
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
        pulledPosition: createServerPosition(),
        koreaderDocument: KOREADER_DOCUMENT,
      }),
    ).toBe(SERVER_PROGRESS)
  })

  it("opens at the bookmark when it moved after the server received its position", () => {
    expect(
      getKoreaderProgressToOpenAt({
        book: bookmarkedBook,
        pulledPosition: createServerPosition({
          updatedAt: "2026-10-20T07:00:00.000Z",
        }),
        koreaderDocument: KOREADER_DOCUMENT,
      }),
    ).toBeUndefined()
  })

  it("opens at the bookmark when this installation pushed the server's position", () => {
    expect(
      getKoreaderProgressToOpenAt({
        book: bookmarkedBook,
        pulledPosition: createServerPosition({
          deviceId: getOrCreateInstallationId(),
        }),
        koreaderDocument: KOREADER_DOCUMENT,
      }),
    ).toBeUndefined()
  })

  it("opens at the bookmark when the server's position is for another file", () => {
    expect(
      getKoreaderProgressToOpenAt({
        book: bookmarkedBook,
        pulledPosition: createServerPosition({ document: "another-file" }),
        koreaderDocument: KOREADER_DOCUMENT,
      }),
    ).toBeUndefined()
  })

  it("opens at the bookmark when the server's position is the bookmark's place", () => {
    expect(
      getKoreaderProgressToOpenAt({
        book: bookmarkedBook,
        pulledPosition: createServerPosition({ progress: BOOKMARK_PROGRESS }),
        koreaderDocument: KOREADER_DOCUMENT,
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
        pulledPosition: createServerPosition({
          updatedAt: "2026-10-20T07:00:00.000Z",
        }),
        koreaderDocument: KOREADER_DOCUMENT,
      }),
    ).toBe(SERVER_PROGRESS)
  })

  it("opens at the server's undated position only when it is further than the bookmark", () => {
    const openAtUndatedPosition = (percentage: number) =>
      getKoreaderProgressToOpenAt({
        book: bookmarkedBook,
        pulledPosition: createServerPosition({ updatedAt: null, percentage }),
        koreaderDocument: KOREADER_DOCUMENT,
      })

    expect(openAtUndatedPosition(0.6)).toBe(SERVER_PROGRESS)
    expect(openAtUndatedPosition(0.1)).toBeUndefined()
  })

  it("compares the position saved on the book when none was just asked for", () => {
    expect(
      getKoreaderProgressToOpenAt({
        book: {
          ...bookmarkedBook,
          readingStateKoreaderSyncPosition: createServerPosition(),
        },
        pulledPosition: undefined,
        koreaderDocument: KOREADER_DOCUMENT,
      }),
    ).toBe(SERVER_PROGRESS)
  })

  it("leaves the position saved on the book aside once the server says it keeps none", () => {
    expect(
      getKoreaderProgressToOpenAt({
        book: {
          ...bookmarkedBook,
          readingStateKoreaderSyncPosition: createServerPosition(),
        },
        pulledPosition: null,
        koreaderDocument: KOREADER_DOCUMENT,
      }),
    ).toBeUndefined()
  })
})
