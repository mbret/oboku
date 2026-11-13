import type { BookMetadata } from "@oboku/shared"
import { isServedBook, toServedFile } from "./opds-library.js"

const PROTECTED_TAG_IDS = ["tag-private"]

describe("isServedBook", () => {
  it("serves a book whose first link is a Google Drive file", () => {
    expect(
      isServedBook({
        book: { tags: ["tag-reading"] },
        firstLinkType: "DRIVE",
        protectedTagIds: PROTECTED_TAG_IDS,
      }),
    ).toBe(true)
  })

  it.each([
    [
      "a book under a protected tag",
      { tags: ["tag-reading", "tag-private"] },
      "DRIVE",
    ],
    [
      "a book marked not interested",
      { tags: [], isNotInterested: true },
      "DRIVE",
    ],
    ["a book on another provider", { tags: [] }, "dropbox"],
    ["a book without links", { tags: [] }, undefined],
  ] as const)("leaves out %s", (_, book, firstLinkType) => {
    expect(
      isServedBook({ book, firstLinkType, protectedTagIds: PROTECTED_TAG_IDS }),
    ).toBe(false)
  })

  it("keeps a book whose tag id names no protected tag", () => {
    expect(
      isServedBook({
        book: { tags: ["tag-deleted"], isNotInterested: false },
        firstLinkType: "DRIVE",
        protectedTagIds: PROTECTED_TAG_IDS,
      }),
    ).toBe(true)
  })
})

describe("toServedFile", () => {
  const epubEntry: BookMetadata = {
    type: "file",
    version: 5,
    contentType: "application/epub+zip",
    metadata: { titles: [{ value: "Dune" }] },
  }

  it("names the file as on its provider, without oboku's directives", () => {
    expect(
      toServedFile({
        _id: "book-dune",
        metadata: [
          { type: "link", title: "Dune [oboku~isbn~9780441013593].epub" },
          epubEntry,
        ],
      }),
    ).toEqual({ name: "Dune.epub", contentType: "application/epub+zip" })
  })

  it("adds the media type's extension to a name without one", () => {
    expect(
      toServedFile({
        _id: "book-dune",
        metadata: [{ type: "link", title: "Dune" }, epubEntry],
      }).name,
    ).toBe("Dune.epub")
  })

  it("names the file after the book's title when its provider's name is unknown", () => {
    expect(toServedFile({ _id: "book-dune", metadata: [epubEntry] }).name).toBe(
      "Dune.epub",
    )
  })

  it("falls back to the book's id and a generic media type", () => {
    expect(toServedFile({ _id: "book-unknown", metadata: [] })).toEqual({
      name: "book-unknown",
      contentType: "application/octet-stream",
    })
  })
})
