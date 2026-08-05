import { describe, expect, it } from "vitest"
import {
  EMPTY_BOOK_OPTIMIZE_FORM_VALUES,
  hasImageCompressionOperation,
} from "./form"

describe("hasImageCompressionOperation", () => {
  it("allows WebP conversion without resize dimensions", () => {
    expect(
      hasImageCompressionOperation({
        ...EMPTY_BOOK_OPTIMIZE_FORM_VALUES,
        imageOutputMode: "webp",
      }),
    ).toBe(true)
  })

  it("requires a resize dimension when keeping the original format", () => {
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
