import { describe, expect, it } from "vitest"
import {
  EMPTY_BOOK_OPTIMIZE_FORM_VALUES,
  hasImageCompressionOperation,
} from "./form"

describe("EMPTY_BOOK_OPTIMIZE_FORM_VALUES", function testEmptyBookOptimizeFormValues() {
  it("keeps the original image format by default", function keepOriginalImageFormat() {
    expect(EMPTY_BOOK_OPTIMIZE_FORM_VALUES.imageOutputMode).toBe("original")
  })
})

describe("hasImageCompressionOperation", function testHasImageCompressionOperation() {
  it("allows WebP conversion without resize dimensions", function allowWebpWithoutResizeDimensions() {
    expect(
      hasImageCompressionOperation({
        ...EMPTY_BOOK_OPTIMIZE_FORM_VALUES,
        imageOutputMode: "webp",
      }),
    ).toBe(true)
  })

  it("allows AVIF conversion without resize dimensions", function allowAvifWithoutResizeDimensions() {
    expect(
      hasImageCompressionOperation({
        ...EMPTY_BOOK_OPTIMIZE_FORM_VALUES,
        imageOutputMode: "avif",
      }),
    ).toBe(true)
  })

  it("requires a resize dimension when keeping the original format", function requireResizeDimensionForOriginalFormat() {
    expect(
      hasImageCompressionOperation({
        ...EMPTY_BOOK_OPTIMIZE_FORM_VALUES,
        imageOutputMode: "original",
      }),
    ).toBe(false)
    expect(
      hasImageCompressionOperation({
        ...EMPTY_BOOK_OPTIMIZE_FORM_VALUES,
        imageOutputMode: "original",
        maxHeight: "1600",
      }),
    ).toBe(true)
  })
})
