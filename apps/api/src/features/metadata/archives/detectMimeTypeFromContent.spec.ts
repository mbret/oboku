import path from "node:path"
import { describe, expect, it } from "vitest"
import { detectMimeTypeFromContent } from "./detectMimeTypeFromContent.js"

const ONE_PAGE_RAR = path.join(import.meta.dirname, "fixtures", "one-page.rar")
const ONE_PAGE_EPUB = path.join(
  import.meta.dirname,
  "fixtures",
  "one-page.epub",
)
const ONE_PAGE_ZIP = path.join(import.meta.dirname, "fixtures", "one-page.zip")
const ONE_PAGE_TXT = path.join(import.meta.dirname, "fixtures", "one-page.txt")

describe("detectMimeTypeFromContent", () => {
  it("detects a RAR archive from its signature", async () => {
    expect(await detectMimeTypeFromContent(ONE_PAGE_RAR)).toBe(
      "application/vnd.rar",
    )
  })

  it("detects a zip archive holding an OPF file as an EPUB", async () => {
    expect(await detectMimeTypeFromContent(ONE_PAGE_EPUB)).toBe(
      "application/epub+zip",
    )
  })

  it("detects any other zip archive as a zip", async () => {
    expect(await detectMimeTypeFromContent(ONE_PAGE_ZIP)).toBe(
      "application/zip",
    )
  })

  it("detects nothing in a file that is not an archive", async () => {
    expect(await detectMimeTypeFromContent(ONE_PAGE_TXT)).toBeUndefined()
  })
})
