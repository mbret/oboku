import { describe, expect, it } from "vitest"
import { isFileSupported } from "./contentType"

describe("isFileSupported", () => {
  it("should accept supported extensions regardless of case", () => {
    expect(isFileSupported({ name: "MyBook.EPUB" })).toBe(true)
    expect(isFileSupported({ name: "comic.CBZ" })).toBe(true)
    expect(isFileSupported({ name: "document.Pdf" })).toBe(true)
  })

  it("should accept supported lowercase extensions", () => {
    expect(isFileSupported({ name: "MyBook.epub" })).toBe(true)
    expect(isFileSupported({ name: "comic.cbz" })).toBe(true)
    expect(isFileSupported({ name: "archive.zip" })).toBe(true)
  })

  it("should accept supported mime types when the name is not recognized", () => {
    expect(
      isFileSupported({ name: "no-extension", mimeType: "application/pdf" }),
    ).toBe(true)
  })

  it("should reject unsupported files", () => {
    expect(isFileSupported({ name: "movie.mkv" })).toBe(false)
    expect(isFileSupported({ name: "movie.MKV" })).toBe(false)
    expect(isFileSupported({ name: "no-extension" })).toBe(false)
    expect(isFileSupported({})).toBe(false)
  })
})
