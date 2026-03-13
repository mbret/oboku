import { resolveDownloadFileName } from "@oboku/shared"
import { describe, expect, it } from "vitest"
import { restoreCachedBookFile } from "./getBookFile.shared"

describe("restoreCachedBookFile", () => {
  it("preserves the stored filename when rebuilding a cached blob", () => {
    const restoredFile = restoreCachedBookFile({
      file: new Blob(["hello"], { type: "text/plain" }),
      filename: "chapter.txt",
    })

    expect(restoredFile).toBeInstanceOf(File)
    expect(restoredFile.name).toBe("chapter.txt")
    expect(restoredFile.type).toBe("text/plain")
  })
})

describe("resolveDownloadFileName", () => {
  it("prefers the filename from content disposition", () => {
    expect(
      resolveDownloadFileName({
        contentDisposition: `attachment; filename="remote-book.txt"`,
        url: "https://example.com/download",
      }),
    ).toBe("remote-book.txt")
  })

  it("falls back to the url path when no content disposition is available", () => {
    expect(
      resolveDownloadFileName({
        url: "https://example.com/library/remote-book.txt?download=1",
      }),
    ).toBe("remote-book.txt")
  })
})
