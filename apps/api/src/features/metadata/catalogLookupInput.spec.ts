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
        userIsbn: undefined,
        directiveIsbn: undefined,
        directiveGoogleVolumeId: undefined,
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
        userIsbn: undefined,
        directiveIsbn: undefined,
        directiveGoogleVolumeId: undefined,
      }),
    ).toEqual({ title: "Dune" })
  })

  it("asks no title when the link's name is only directives", () => {
    expect(
      catalogLookupInput({
        fileMetadata: undefined,
        linkName: "[oboku~tags~unread].epub",
        userIsbn: undefined,
        directiveIsbn: undefined,
        directiveGoogleVolumeId: undefined,
      }),
    ).toEqual({})
  })

  it("prefers the user's ISBN to the file's identifiers", () => {
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
        userIsbn: "9780593099322",
        directiveIsbn: undefined,
        directiveGoogleVolumeId: undefined,
      }).identifiers,
    ).toEqual([
      { value: "9780593099322", scheme: "ISBN" },
      { value: "https://www.gutenberg.org/ebooks/1234", scheme: "URL" },
    ])
  })

  it("prefers a directive's Google Books volume id to the file's ISBN and volume id", () => {
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
        userIsbn: undefined,
        directiveIsbn: undefined,
        directiveGoogleVolumeId: "B1hSG45JCX4C",
      }).identifiers,
    ).toEqual([{ value: "B1hSG45JCX4C", scheme: "GoogleBooks" }])
  })

  it("prefers the user's ISBN to the directive's", () => {
    expect(
      catalogLookupInput({
        fileMetadata: undefined,
        linkName: "Dune.epub",
        userIsbn: "9780593099322",
        directiveIsbn: "9780441013593",
        directiveGoogleVolumeId: undefined,
      }).identifiers,
    ).toEqual([{ value: "9780593099322", scheme: "ISBN" }])
  })

  it("prefers the user's ISBN to a directive's volume id", () => {
    expect(
      catalogLookupInput({
        fileMetadata: undefined,
        linkName: "Dune.epub",
        userIsbn: "9780593099322",
        directiveIsbn: undefined,
        directiveGoogleVolumeId: "B1hSG45JCX4C",
      }).identifiers,
    ).toEqual([{ value: "9780593099322", scheme: "ISBN" }])
  })

  it("prefers a directive's volume id to a directive's ISBN", () => {
    expect(
      catalogLookupInput({
        fileMetadata: undefined,
        linkName: "Dune.epub",
        userIsbn: undefined,
        directiveIsbn: "9780441013593",
        directiveGoogleVolumeId: "B1hSG45JCX4C",
      }).identifiers,
    ).toEqual([{ value: "B1hSG45JCX4C", scheme: "GoogleBooks" }])
  })
})
