import { getBookMetadataFields, type LegacyFileMetadata } from "@oboku/shared"
import { describe, expect, it } from "vitest"
import { fileMetadataFromLegacy } from "./fileMetadataFromLegacy.js"

const fullLegacyEntry: LegacyFileMetadata = {
  type: "file",
  contentType: "application/epub+zip",
  title: "Dune",
  authors: ["Frank Herbert", "Brian Herbert"],
  publisher: "Ace",
  date: { year: 1990, month: 9 },
  rights: "All rights reserved",
  languages: ["en"],
  subjects: ["Science fiction"],
  coverLink: "OEBPS/cover.jpg",
  coverConfidence: "derived",
  pageCount: 412,
  isbn: "9780441013593",
  googleVolumeId: "zyTCAlFPjgYC",
}

describe("fileMetadataFromLegacy", () => {
  it("keeps every field the flat entry showed", () => {
    expect(
      getBookMetadataFields(fileMetadataFromLegacy(fullLegacyEntry)),
    ).toEqual(getBookMetadataFields(fullLegacyEntry))
  })

  it("stores the fields in archive-reader's vocabulary", () => {
    expect(fileMetadataFromLegacy(fullLegacyEntry)).toEqual({
      type: "file",
      contentType: "application/epub+zip",
      metadata: {
        titles: [{ value: "Dune" }],
        contributors: [
          { name: "Frank Herbert", roles: ["author"] },
          { name: "Brian Herbert", roles: ["author"] },
        ],
        publication: {
          edition: { publisher: "Ace", date: { year: 1990, month: 9 } },
        },
        rights: "All rights reserved",
        languages: ["en"],
        subjects: ["Science fiction"],
        cover: { uri: "OEBPS/cover.jpg", confidence: "derived" },
        numberOfPages: 412,
        identifiers: [
          { value: "9780441013593", scheme: "ISBN" },
          { value: "zyTCAlFPjgYC", scheme: "GoogleBooks" },
        ],
      },
    })
  })

  it("assumes the cover of an entry stored before cover confidence existed", () => {
    const converted = fileMetadataFromLegacy({
      type: "file",
      coverLink: "page-001.jpg",
    })

    expect(converted.metadata.cover).toEqual({
      uri: "page-001.jpg",
      confidence: "assumed",
    })
  })

  it("leaves out what the flat entry did not state", () => {
    expect(
      fileMetadataFromLegacy({ type: "file", authors: [], languages: [] }),
    ).toEqual({ type: "file", metadata: {} })
  })
})
