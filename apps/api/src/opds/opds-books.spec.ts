import type { BookMetadata } from "@oboku/shared"
import {
  CATALOG_PAGE_SIZE,
  compareByTitle,
  compareNewestFirst,
  isBookShown,
  toCatalogPage,
  toServedFile,
  toServedShelfBookIds,
  toShelfTitle,
} from "./opds-books.js"

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

  it("keeps the name of a file whose book extension follows a #", () => {
    expect(nameOf("Dune #1.epub")).toBe("Dune #1.epub")
  })

  it("keeps a name's path separators from cutting it short", () => {
    expect(nameOf("Fate/Zero 01.epub")).toBe("Fate-Zero 01.epub")
  })

  it("names the file after the book's title when its provider's name is unknown", () => {
    expect(toServedFile({ _id: "book-dune", metadata: [epubEntry] }).name).toBe(
      "Dune.epub",
    )
  })

  it("serves a stored type the reader does not accept as bytes, without its extension", () => {
    expect(
      toServedFile({
        _id: "book-dune",
        metadata: [
          { type: "link", title: "Dune" },
          { ...epubEntry, contentType: "text/html" },
        ],
      }),
    ).toEqual({ name: "Dune", contentType: "application/octet-stream" })
  })

  it("serves the bare book type of a stored type with parameters", () => {
    expect(
      toServedFile({
        _id: "book-dune",
        metadata: [
          { ...epubEntry, contentType: "Application/EPUB+zip; charset=utf-8" },
        ],
      }).contentType,
    ).toBe("application/epub+zip")
  })

  it("falls back to the book's id and a generic media type", () => {
    expect(toServedFile({ _id: "book-unknown", metadata: [] })).toEqual({
      name: "book-unknown",
      contentType: "application/octet-stream",
    })
  })
})

describe("compareNewestFirst", () => {
  it("orders the books added last first, then books added together by id", () => {
    const books = [
      { _id: "book-dune", createdAt: 1 },
      { _id: "book-emma", createdAt: 2 },
      { _id: "book-arrakis", createdAt: 1 },
    ]

    expect(books.toSorted(compareNewestFirst).map(({ _id }) => _id)).toEqual([
      "book-emma",
      "book-arrakis",
      "book-dune",
    ])
  })
})

describe("compareByTitle", () => {
  it("orders titles naturally, ignoring case, then by id", () => {
    const shelves = [
      { id: "shelf-c", title: "Vol 10" },
      { id: "shelf-b", title: "vol 2" },
      { id: "shelf-a", title: "Vol 2" },
    ]

    expect(shelves.toSorted(compareByTitle).map(({ id }) => id)).toEqual([
      "shelf-a",
      "shelf-b",
      "shelf-c",
    ])
  })
})

describe("toShelfTitle", () => {
  it("names a shelf as the app does by default, without oboku's directives", () => {
    expect(
      toShelfTitle({
        metadata: [
          { type: "link", title: "Dune [oboku~series]" },
          { type: "user", title: "Dune saga [oboku~series]" },
        ],
      }),
    ).toBe("Dune saga")
  })

  it("names a shelf without a title", () => {
    expect(toShelfTitle({ metadata: [] })).toBe("Untitled shelf")
    expect(toShelfTitle({})).toBe("Untitled shelf")
  })
})

describe("toServedShelfBookIds", () => {
  const servedBookIds = new Set(["book-dune", "book-emma"])
  const protectedBookIds = new Set(["book-private"])

  it("keeps the shelf's served books once each, in its order", () => {
    expect(
      toServedShelfBookIds({
        shelfBookIds: ["book-emma", "book-dropbox", "book-dune", "book-emma"],
        servedBookIds,
        protectedBookIds,
      }),
    ).toEqual(["book-emma", "book-dune"])
  })

  it("lists nothing of a shelf holding a book under a protected tag", () => {
    expect(
      toServedShelfBookIds({
        shelfBookIds: ["book-dune", "book-private"],
        servedBookIds,
        protectedBookIds,
      }),
    ).toEqual([])
  })
})

describe("toCatalogPage", () => {
  const items = Array.from(
    { length: CATALOG_PAGE_SIZE + 1 },
    (_, index) => index,
  )

  it("cuts a list into pages and says where each stands", () => {
    expect(toCatalogPage(items, 2)).toEqual({
      items: [CATALOG_PAGE_SIZE],
      page: {
        number: 2,
        size: CATALOG_PAGE_SIZE,
        total: CATALOG_PAGE_SIZE + 1,
      },
    })
  })

  it("has a first page for an empty list and no page past the last", () => {
    expect(toCatalogPage([], 1)?.items).toEqual([])
    expect(toCatalogPage(items, 3)).toBeUndefined()
  })
})
