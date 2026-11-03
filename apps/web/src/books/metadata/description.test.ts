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

  it("joins the lines HTML wraps inside a paragraph", () => {
    expect(
      getDescriptionText(
        "<p>Set on the desert planet\n  Arrakis.</p>\n<p><b>Bold</b>\n<i>Italic</i></p>",
      ),
    ).toBe("Set on the desert planet Arrakis.\n\nBold Italic")
  })

  it("leaves plain text as it is, line breaks included", () => {
    expect(
      getDescriptionText("Ash falls from the sky.\nMists &amp; more"),
    ).toBe("Ash falls from the sky.\nMists & more")
  })
})
