import { describe, expect, it } from "vitest"
import { getBookMetadataFields } from "./fields"

describe("getBookMetadataFields, for a file entry holding archive-reader's metadata", () => {
  const fields = getBookMetadataFields({
    type: "file",
    contentType: "application/epub+zip",
    metadata: {
      titles: [{ value: "The Final Empire", type: "main" }],
      contributors: [
        { name: "Brandon Sanderson", roles: ["author"] },
        { name: "Isaac Stewart", roles: ["illustrator"] },
      ],
      cover: { uri: "OEBPS/cover.jpg", confidence: "derived" },
      identifiers: [{ scheme: "ISBN", value: "9780765311788" }],
      publication: {
        edition: { publisher: "Tor Books" },
        original: { date: { year: 2006, month: 7 } },
      },
      languages: ["en"],
      subjects: [],
    },
  })

  it("reads the title, the authors and the identifiers", () => {
    expect(fields.title).toBe("The Final Empire")
    expect(fields.authors).toEqual(["Brandon Sanderson"])
    expect(fields.isbn).toBe("9780765311788")
  })

  it("keeps the cover with how the container named it", () => {
    expect(fields.coverLink).toBe("OEBPS/cover.jpg")
    expect(fields.coverConfidence).toBe("derived")
    expect(fields.contentType).toBe("application/epub+zip")
  })

  it("falls back to the original publication for what the edition does not state", () => {
    expect(fields.publisher).toBe("Tor Books")
    expect(fields.date).toEqual({ year: 2006, month: 7 })
  })

  it("leaves out empty lists", () => {
    expect(fields.languages).toEqual(["en"])
    expect(fields.subjects).toBeUndefined()
  })
})

describe("getBookMetadataFields, for a catalog match", () => {
  const fields = getBookMetadataFields({
    type: "catalog",
    version: 1,
    providerId: "openLibrary",
    score: 1,
    accepted: true,
    signals: [],
    metadata: {
      titles: [{ value: "Mistborn" }],
      description: "Ash falls from the sky.",
      aggregateRating: { value: 4.2, count: 120 },
      cover: {
        uri: "https://covers.openlibrary.org/b/id/1-L.jpg",
        confidence: "derived",
      },
    },
  })

  it("reads the record's fields", () => {
    expect(fields.title).toBe("Mistborn")
    expect(fields.description).toBe("Ash falls from the sky.")
    expect(fields.rating).toBe(4.2)
    expect(fields.coverLink).toBe("https://covers.openlibrary.org/b/id/1-L.jpg")
  })

  it("does not claim a cover confidence, which only the file can state", () => {
    expect(fields.coverConfidence).toBeUndefined()
  })
})

describe("getBookMetadataFields, for flat entries", () => {
  it("reads a legacy catalog entry as it is stored", () => {
    expect(
      getBookMetadataFields({
        type: "googleBookApi",
        title: "BLAME! Vol 1",
        formatType: ["comics", "manga"],
      }),
    ).toEqual({ title: "BLAME! Vol 1", formatType: ["comics", "manga"] })
  })

  it("reads a legacy file entry as it is stored", () => {
    expect(
      getBookMetadataFields({
        type: "file",
        coverLink: "p001.avif",
        coverConfidence: "assumed",
      }),
    ).toEqual({ coverLink: "p001.avif", coverConfidence: "assumed" })
  })

  it("reads link and user entries as they are stored", () => {
    expect(
      getBookMetadataFields({ type: "link", title: "Mistborn.epub" }),
    ).toEqual({ title: "Mistborn.epub" })
    expect(getBookMetadataFields({ type: "user", isbn: "123" })).toEqual({
      isbn: "123",
    })
  })
})
