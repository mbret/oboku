import type { SynchronizeAbleItem } from "../types.js"
import { listEachBookOncePerTopFolder } from "./listings.js"

type OpdsItem = SynchronizeAbleItem<"opds">

const book = (entryId: string, title = entryId): OpdsItem => ({
  type: "file",
  name: title,
  modifiedAt: "2026-01-01T00:00:00.000Z",
  linkData: {
    connectorId: "connector",
    entryId,
    title,
    acquisition: {
      href: `https://catalog.example.com/${title}.epub`,
      type: "application/epub+zip",
    },
  },
})

const folder = (title: string, items: OpdsItem[]): OpdsItem => ({
  type: "folder",
  name: title,
  modifiedAt: "2026-01-01T00:00:00.000Z",
  linkData: {
    connectorId: "connector",
    feedUrl: `https://catalog.example.com/opds/${title}`,
    title,
  },
  items,
})

describe("listEachBookOncePerTopFolder", () => {
  it("gives every listing of a book the data of its first listing", () => {
    const firstListing = book("urn:book:1", "Book 1")

    expect(
      listEachBookOncePerTopFolder([
        folder("Series", [firstListing]),
        folder("Latest", [book("urn:book:1", "Series: Book 1")]),
      ]),
    ).toEqual([
      folder("Series", [firstListing]),
      folder("Latest", [firstListing]),
    ])
  })

  it("lists a book once under a top-level folder, nested folders included", () => {
    expect(
      listEachBookOncePerTopFolder([
        folder("Authors", [
          folder("Ada", [book("urn:book:1")]),
          folder("Alan", [book("urn:book:1"), book("urn:book:2")]),
        ]),
      ]),
    ).toEqual([
      folder("Authors", [
        folder("Ada", [book("urn:book:1")]),
        folder("Alan", [book("urn:book:2")]),
      ]),
    ])
  })

  it("drops the folders left without books", () => {
    expect(
      listEachBookOncePerTopFolder([
        folder("Ada", [book("urn:book:1")]),
        folder("Empty", [folder("Also empty", [])]),
        folder("Ada again", [folder("Ada", [book("urn:book:1")])]),
      ]),
    ).toEqual([
      folder("Ada", [book("urn:book:1")]),
      folder("Ada again", [folder("Ada", [book("urn:book:1")])]),
    ])
  })
})
