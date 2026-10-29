import type { SynchronizeAbleItem } from "../types.js"
import { listEachBookOncePerTopFolder } from "./listings.js"

type OpdsItem = SynchronizeAbleItem<"opds">

const book = (entryId: string): OpdsItem => ({
  type: "file",
  name: entryId,
  modifiedAt: "2026-01-01T00:00:00.000Z",
  linkData: {
    connectorId: "connector",
    entryId,
    title: entryId,
    acquisition: {
      href: `https://catalog.example.com/${entryId}.epub`,
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
