import { escapeXml } from "./escapeXml.js"

describe("escapeXml", () => {
  it("escapes the characters that would read as markup", () => {
    expect(escapeXml(`Kids' <books> & "more"`)).toBe(
      "Kids' &lt;books&gt; &amp; &quot;more&quot;",
    )
  })

  it("replaces the characters XML forbids", () => {
    expect(escapeXml("Kids\u000bbooks\u0000\uD800")).toBe("Kids�books��")
  })

  it("keeps tabs, line breaks and characters past the basic plane", () => {
    expect(escapeXml("Kids\tbooks\r\n📚")).toBe("Kids\tbooks\r\n📚")
  })
})
