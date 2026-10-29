import { escapeXml } from "./escapeXml.js"

describe("escapeXml", () => {
  it("escapes the characters that would read as markup", () => {
    expect(escapeXml(`Kids' <books> & "more"`)).toBe(
      "Kids' &lt;books&gt; &amp; &quot;more&quot;",
    )
  })

  it("replaces the characters XML forbids", () => {
    expect(escapeXml("Kids\u000bbooks\u0000\uD800")).toBe(
      "Kids\uFFFDbooks\uFFFD\uFFFD",
    )
  })

  it("keeps tabs, line breaks and characters past the basic plane", () => {
    expect(escapeXml("Kids\tbooks\r\n\u{1F4DA}")).toBe(
      "Kids\tbooks\r\n\u{1F4DA}",
    )
  })
})
