import { describe, expect, it } from "vitest"
import { getDescriptionText } from "./description"

describe("getDescriptionText", () => {
  it("reads calibre's HTML comments as paragraphs of text", () => {
    expect(
      getDescriptionText(
        "<div><p>Set on the desert planet <i>Arrakis</i>.</p><p>A classic.</p></div>",
      ),
    ).toBe("Set on the desert planet Arrakis.\n\nA classic.")
  })

  it("keeps line breaks", () => {
    expect(getDescriptionText("First line<br>Second line")).toBe(
      "First line\nSecond line",
    )
  })

  it("leaves plain text as it is", () => {
    expect(getDescriptionText("Ash falls from the sky. Mists & more")).toBe(
      "Ash falls from the sky. Mists & more",
    )
  })
})
