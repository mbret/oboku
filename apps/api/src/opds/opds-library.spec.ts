import type { BookMetadata } from "@oboku/shared"
import { isBookShown, toServedFile } from "./opds-library.js"

const PROTECTED_TAG_IDS = ["tag-private"]

describe("isBookShown", () => {
  it("shows a book no protected tag hides", () => {
    expect(
      isBookShown({
        book: { tags: ["tag-reading"] },
        protectedTagIds: PROTECTED_TAG_IDS,
      }),
    ).toBe(true)
  })

  it.each([
    ["a book under a protected tag", { tags: ["tag-reading", "tag-private"] }],
    ["a book marked not interested", { tags: [], isNotInterested: true }],
  ] as const)("hides %s", (_, book) => {
    expect(isBookShown({ book, protectedTagIds: PROTECTED_TAG_IDS })).toBe(
      false,
    )
  })

  it("shows a book whose tag id names no protected tag", () => {
    expect(
      isBookShown({
        book: { tags: ["tag-deleted"], isNotInterested: false },
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

  const nameOf = (providerFileName: string) =>
    toServedFile({
      _id: "book-dune",
      metadata: [{ type: "link", title: providerFileName }, epubEntry],
    }).name

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

  it("adds the media type's extension to a name without a book extension", () => {
    expect(nameOf("Dune")).toBe("Dune.epub")
    expect(nameOf("Dr. Sleep")).toBe("Dr. Sleep.epub")
  })

  it("keeps a name's path separators from cutting it short", () => {
    expect(nameOf("Fate/Zero 01.epub")).toBe("Fate-Zero 01.epub")
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
