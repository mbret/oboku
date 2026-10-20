import { emptyBookmark, type KoreaderSyncPositionDto } from "@oboku/shared"
import { describe, expect, it } from "vitest"
import { getOrCreateInstallationId } from "../common/browser"
import { isKoreaderPositionNewerThanBookmark } from "./isKoreaderPositionNewerThanBookmark"

const KOREADER_DOCUMENT = "8f3a9c1e0b7d4f2a6c5e1d0b9a8f7e6d"
const BOOKMARK_PROGRESS = "/body/DocFragment[3]/body/p[2]/text().0"
const SERVER_PROGRESS = "/body/DocFragment[9]/body/p[12]/text().4"

const bookmarkedBook = {
  readingStateCurrentBookmarkLocation: "epubcfi(/6/4!/4/2/1:0)",
  readingStateCurrentBookmarkLocationUpdatedAt: "2026-10-20T08:00:00.000Z",
  readingStateCurrentBookmarkProgressPercent: 0.2,
  readingStateCurrentBookmarkKoreaderProgress: BOOKMARK_PROGRESS,
  readingStateCurrentBookmarkKoreaderDocument: KOREADER_DOCUMENT,
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

const isNewer = (
  position: Partial<KoreaderSyncPositionDto>,
  book: Partial<
    Parameters<typeof isKoreaderPositionNewerThanBookmark>[0]["book"]
  > = {},
) =>
  isKoreaderPositionNewerThanBookmark({
    book: { ...bookmarkedBook, ...book },
    position: createServerPosition(position),
    koreaderDocument: KOREADER_DOCUMENT,
  })

describe("isKoreaderPositionNewerThanBookmark", () => {
  it("is newer when another device left it after the bookmark moved", () => {
    expect(isNewer({})).toBe(true)
  })

  it("is older when the bookmark moved after the server received it", () => {
    expect(isNewer({ updatedAt: "2026-10-20T07:00:00.000Z" })).toBe(false)
  })

  it("is not newer when this installation pushed it", () => {
    expect(isNewer({ deviceId: getOrCreateInstallationId() })).toBe(false)
  })

  it("is not newer when it is the bookmark's place in the opened file", () => {
    expect(isNewer({ progress: BOOKMARK_PROGRESS })).toBe(false)
  })

  it("is compared by date when the bookmark's place is in another file", () => {
    expect(
      isNewer(
        { progress: BOOKMARK_PROGRESS },
        { readingStateCurrentBookmarkKoreaderDocument: "another-file" },
      ),
    ).toBe(true)
  })

  it("is newer than a bookmark never dated, and than no bookmark", () => {
    expect(
      isNewer(
        { updatedAt: "2026-10-20T07:00:00.000Z" },
        { readingStateCurrentBookmarkLocationUpdatedAt: null },
      ),
    ).toBe(true)
    expect(
      isKoreaderPositionNewerThanBookmark({
        book: {
          ...emptyBookmark,
          readingStateCurrentBookmarkLocationUpdatedAt: null,
        },
        position: createServerPosition(),
        koreaderDocument: KOREADER_DOCUMENT,
      }),
    ).toBe(true)
  })

  it("is newer, without a date from the server, only when further than the bookmark", () => {
    expect(isNewer({ updatedAt: null, percentage: 0.6 })).toBe(true)
    expect(isNewer({ updatedAt: null, percentage: 0.1 })).toBe(false)
  })
})
