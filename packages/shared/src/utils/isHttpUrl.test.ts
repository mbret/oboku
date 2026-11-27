import { describe, expect, it } from "vitest"
import { isHttpUrl } from "./isHttpUrl"

describe("isHttpUrl", () => {
  it.each([
    "http://192.168.1.10/dav",
    "https://nas.local:5006/dav",
    "HTTPS://catalog.example.com/opds",
  ])("accepts %s", (value) => {
    expect(isHttpUrl(value)).toBe(true)
  })

  it.each([
    "",
    "192.168.1.10/dav",
    "nas.local:5005/dav",
    "ftp://nas.local/books",
    "webdav://nas.local/books",
  ])("refuses %j", (value) => {
    expect(isHttpUrl(value)).toBe(false)
  })
})
