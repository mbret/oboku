import type { BookMetadata } from "@oboku/shared"
import { describe, expect, it } from "vitest"
import { getBookMetadataEntryFields } from "./fields"

const catalogTitle = (title: string, position: number | undefined) => {
  const entry: BookMetadata = {
    type: "catalog",
    version: 1,
    providerId: "googleBooks",
    score: 1,
    accepted: true,
    signals: [],
    metadata: {
      titles: [{ value: title }],
      ...(position !== undefined && {
        belongsTo: { series: [{ position }] },
      }),
    },
  }

  return getBookMetadataEntryFields(entry).title
}

describe("getBookMetadataEntryFields, for a catalog match of a series volume", () => {
  it("adds the volume number the title leaves out", () => {
    expect(catalogTitle("BLAME!", 3)).toBe("BLAME! Vol 3")
  })

  it("keeps a title that already states the volume number", () => {
    expect(catalogTitle("BLAME! Vol. 3", 3)).toBe("BLAME! Vol. 3")
    expect(catalogTitle("Naruto 03", 3)).toBe("Naruto 03")
  })

  it("keeps the title of a book outside a series", () => {
    expect(catalogTitle("Dune", undefined)).toBe("Dune")
  })
})
