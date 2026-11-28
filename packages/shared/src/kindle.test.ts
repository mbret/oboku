import { describe, expect, it } from "vitest"
import { isKindleEmail } from "./kindle"

describe("isKindleEmail", () => {
  it.each([
    "reader@kindle.com",
    "first.last_42@kindle.com",
    "reader+books@kindle.com",
    "Reader@Kindle.COM",
  ])("accepts %s", (value) => {
    expect(isKindleEmail(value)).toBe(true)
  })

  it.each([
    "",
    "reader",
    "@kindle.com",
    "reader@gmail.com",
    "reader@kindle.com.example.org",
    "reader@notkindle.com",
    "reader@free.kindle.com",
    " reader@kindle.com",
    "reader@kindle.com ",
    "reader@kindle.com, other@example.org",
    "reader@kindle.com\nBcc: other@example.org",
    "Reader <reader@kindle.com>",
    "other@example.org,reader@kindle.com",
  ])("refuses %j", (value) => {
    expect(isKindleEmail(value)).toBe(false)
  })

  it("refuses an address longer than an email address can be", () => {
    expect(isKindleEmail(`${"a".repeat(250)}@kindle.com`)).toBe(false)
  })
})
