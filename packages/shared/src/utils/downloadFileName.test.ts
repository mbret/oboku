import { describe, expect, it } from "vitest"
import {
  getFileNameFromContentDisposition,
  resolveDownloadFileName,
} from "./downloadFileName"

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

describe("getFileNameFromContentDisposition", () => {
  it.each([
    ['attachment; filename="Dune; Part 1.epub"', "Dune; Part 1.epub"],
    ['attachment; filename="The \\"Best\\" Book.epub"', 'The "Best" Book.epub'],
    ["attachment; filename=Dune.epub", "Dune.epub"],
    [
      `attachment; filename="Dun?.epub"; filename*=UTF-8''Dun%C3%A9.epub`,
      "Duné.epub",
    ],
  ])("reads the name in %s", (contentDisposition, fileName) => {
    expect(getFileNameFromContentDisposition(contentDisposition)).toBe(fileName)
  })
})
