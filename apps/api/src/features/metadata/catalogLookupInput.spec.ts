import type { FileMetadata } from "@oboku/shared"
import { describe, expect, it } from "vitest"
import { catalogLookupInput } from "./catalogLookupInput.js"

const fileStating = (metadata: FileMetadata["metadata"]): FileMetadata => ({
  type: "file",
  metadata,
})

describe("catalogLookupInput", () => {
  it("asks what the file states", () => {
    expect(
      catalogLookupInput({
        fileMetadata: fileStating({
          titles: [{ value: "Dune" }],
          contributors: [{ name: "Frank Herbert", roles: ["author"] }],
          identifiers: [{ value: "9780441013593", scheme: "ISBN" }],
          publication: { edition: { publisher: "Ace", date: { year: 1990 } } },
        }),
        linkName: "dune.epub",
        isbn: undefined,
        googleVolumeId: undefined,
      }),
    ).toEqual({
      title: "Dune",
      authors: ["Frank Herbert"],
      identifiers: [{ value: "9780441013593", scheme: "ISBN" }],
      publisher: "Ace",
      publishedYear: 1990,
    })
  })

  it("falls back to the link's name, without its directives and extension", () => {
    expect(
      catalogLookupInput({
        fileMetadata: undefined,
        linkName: "Dune [oboku~tags~scifi].epub",
        isbn: undefined,
        googleVolumeId: undefined,
      }),
    ).toEqual({ title: "Dune" })
  })

  it("prefers an ISBN given by the user or a directive to the file's identifiers", () => {
    expect(
      catalogLookupInput({
        fileMetadata: fileStating({
          titles: [{ value: "Dune" }],
          identifiers: [
            { value: "9780441013593", scheme: "ISBN" },
            { value: "zyTCAlFPjgYC", scheme: "GoogleBooks" },
            {
              value: "https://www.gutenberg.org/ebooks/1234",
              scheme: "URL",
            },
          ],
        }),
        linkName: "dune.epub",
        isbn: "9780593099322",
        googleVolumeId: undefined,
      }).identifiers,
    ).toEqual([
      { value: "9780593099322", scheme: "ISBN" },
      { value: "https://www.gutenberg.org/ebooks/1234", scheme: "URL" },
    ])
  })

  it("prefers a directive's Google Books volume id to the file's", () => {
    expect(
      catalogLookupInput({
        fileMetadata: fileStating({
          identifiers: [
            { value: "9780441013593", scheme: "ISBN" },
            {
              value: "https://books.google.com/books?id=zyTCAlFPjgYC",
              scheme: "URL",
            },
          ],
        }),
        linkName: undefined,
        isbn: undefined,
        googleVolumeId: "B1hSG45JCX4C",
      }).identifiers,
    ).toEqual([
      { value: "B1hSG45JCX4C", scheme: "GoogleBooks" },
      { value: "9780441013593", scheme: "ISBN" },
    ])
  })
})
