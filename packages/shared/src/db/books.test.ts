import { describe, expect, it } from "vitest"
import {
  getReadingStateReachedProgress,
  getReadingStateUpdatedTime,
  ReadingStateState,
} from "./books"

const EARLIER = "2026-09-01T10:00:00.000Z"
const LATER = "2026-09-20T10:00:00.000Z"

describe(`getReadingStateUpdatedTime`, () => {
  it(`is undefined for a book whose reading state never changed`, () => {
    expect(
      getReadingStateUpdatedTime({ readingStateUpdatedAt: null }),
    ).toBeUndefined()
  })

  it(`reads the deprecated date of a book last changed before readingStateUpdatedAt existed`, () => {
    expect(
      getReadingStateUpdatedTime({
        readingStateCurrentBookmarkProgressUpdatedAt: EARLIER,
      }),
    ).toBe(new Date(EARLIER).getTime())
  })

  it(`is the later of both dates, whichever version of the app wrote it`, () => {
    expect(
      getReadingStateUpdatedTime({
        readingStateUpdatedAt: EARLIER,
        readingStateCurrentBookmarkProgressUpdatedAt: LATER,
      }),
    ).toBe(new Date(LATER).getTime())
    expect(
      getReadingStateUpdatedTime({
        readingStateUpdatedAt: LATER,
        readingStateCurrentBookmarkProgressUpdatedAt: EARLIER,
      }),
    ).toBe(new Date(LATER).getTime())
  })
})

describe(`getReadingStateReachedProgress`, () => {
  it(`is the reached progress of a book being read`, () => {
    expect(
      getReadingStateReachedProgress({
        readingStateCurrentState: ReadingStateState.Reading,
        readingStateReachedProgressPercent: 0.9,
        readingStateCurrentBookmarkProgressPercent: 0.8,
      }),
    ).toBe(0.9)
  })

  it(`is the bookmark progress of a book last read before the reached progress existed`, () => {
    expect(
      getReadingStateReachedProgress({
        readingStateCurrentState: ReadingStateState.Reading,
        readingStateCurrentBookmarkProgressPercent: 0.5,
      }),
    ).toBe(0.5)
  })

  it(`is 1 for a finished book and 0 for one not started, whatever is stored`, () => {
    expect(
      getReadingStateReachedProgress({
        readingStateCurrentState: ReadingStateState.Finished,
        readingStateReachedProgressPercent: 0.9,
        readingStateCurrentBookmarkProgressPercent: 0.8,
      }),
    ).toBe(1)
    expect(
      getReadingStateReachedProgress({
        readingStateCurrentState: ReadingStateState.NotStarted,
        readingStateReachedProgressPercent: 0.4,
        readingStateCurrentBookmarkProgressPercent: 0.4,
      }),
    ).toBe(0)
  })
})
