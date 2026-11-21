import { describe, expect, it } from "vitest"
import { getReaderPreviewRoute, getUsesReadingData } from "./mode"

const getSearchParams = (route: string) =>
  new URL(route, window.location.origin).searchParams

describe("getUsesReadingData", () => {
  it("uses reading data in a reading session, whose route sets no mode", () => {
    expect(getUsesReadingData(getSearchParams("/reader/book-1"))).toBe(true)
  })

  it("uses no reading data in preview", () => {
    expect(
      getUsesReadingData(getSearchParams(getReaderPreviewRoute("book-1"))),
    ).toBe(false)
  })
})
