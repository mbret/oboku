import type { BookMetadata } from "@oboku/shared"
import { describe, expect, it } from "vitest"
import { pickCoverMetadata } from "./pickCoverMetadata.js"

const firstPage: BookMetadata = {
  type: "file",
  contentType: "application/x-cbz",
  coverLink: "BLAME! - c001 (v01) - p001.avif",
  coverConfidence: "assumed",
}
const declaredCover: BookMetadata = {
  type: "file",
  contentType: "application/epub+zip",
  coverLink: "OEBPS/cover.jpg",
  coverConfidence: "derived",
}
const googleCover: BookMetadata = {
  type: "googleBookApi",
  coverLink: "https://books.google.com/books/content?id=Ebb6DQAAQBAJ",
}
const linkNamingTheVolume: BookMetadata = {
  type: "link",
  title: "BLAME! [oboku~google-volume-id~Ebb6DQAAQBAJ].cbz",
}

describe("pickCoverMetadata, with no source certain of its cover", () => {
  it("takes the highest-priority cover", () => {
    expect(pickCoverMetadata([googleCover, firstPage], undefined)).toBe(
      firstPage,
    )
  })

  it("honors a reordered priority", () => {
    expect(
      pickCoverMetadata([googleCover, firstPage], ["googleBookApi", "file"]),
    ).toBe(googleCover)
  })

  it("skips a source carrying no cover", () => {
    expect(pickCoverMetadata([{ type: "file" }, googleCover], undefined)).toBe(
      googleCover,
    )
  })

  it("returns nothing when nothing carries a cover", () => {
    expect(pickCoverMetadata([{ type: "file" }], undefined)).toBeUndefined()
    expect(pickCoverMetadata([], undefined)).toBeUndefined()
    expect(pickCoverMetadata(undefined, undefined)).toBeUndefined()
  })
})

describe("pickCoverMetadata, when one source is certain", () => {
  it("prefers a confirmed catalog match over the archive's first page", () => {
    expect(
      pickCoverMetadata(
        [linkNamingTheVolume, googleCover, firstPage],
        undefined,
      ),
    ).toBe(googleCover)
  })

  it("confirms a catalog match by the volume id the file states", () => {
    expect(
      pickCoverMetadata(
        [googleCover, { ...firstPage, googleVolumeId: "Ebb6DQAAQBAJ" }],
        undefined,
      ),
    ).toBe(googleCover)
  })

  it("prefers a declared cover over an unconfirmed catalog match", () => {
    expect(
      pickCoverMetadata(
        [googleCover, declaredCover],
        ["googleBookApi", "file"],
      ),
    ).toBe(declaredCover)
  })

  it("falls back to the guess when the certain source has no cover", () => {
    expect(
      pickCoverMetadata(
        [linkNamingTheVolume, { type: "googleBookApi" }, firstPage],
        undefined,
      ),
    ).toBe(firstPage)
  })
})

describe("pickCoverMetadata, when both sources are certain", () => {
  it("defers to the priority order", () => {
    expect(
      pickCoverMetadata(
        [linkNamingTheVolume, googleCover, declaredCover],
        undefined,
      ),
    ).toBe(declaredCover)

    expect(
      pickCoverMetadata(
        [linkNamingTheVolume, googleCover, declaredCover],
        ["googleBookApi", "file"],
      ),
    ).toBe(googleCover)
  })
})

describe("pickCoverMetadata, when the archive never stated its cover", () => {
  const unknownCover: BookMetadata = {
    type: "file",
    contentType: "application/x-cbz",
    coverLink: "page-001.jpg",
  }

  it("does not treat an unanswered cover as declared", () => {
    expect(
      pickCoverMetadata(
        [linkNamingTheVolume, googleCover, unknownCover],
        undefined,
      ),
    ).toBe(googleCover)
  })

  it("still uses it when no source is certain", () => {
    expect(pickCoverMetadata([googleCover, unknownCover], undefined)).toBe(
      unknownCover,
    )
  })
})

describe("pickCoverMetadata, with entries in prose-reader's shapes", () => {
  const catalogMatch = (
    score: number,
    signals: Extract<BookMetadata, { type: "catalog" }>["signals"],
  ): BookMetadata => ({
    type: "catalog",
    version: 1,
    providerId: "googleBooks",
    score,
    accepted: true,
    signals,
    metadata: {
      cover: {
        uri: "https://books.google.com/books/content?id=Ebb6DQAAQBAJ",
        confidence: "derived",
      },
    },
  })
  const confirmedMatch = catalogMatch(1, [
    {
      field: "isbn",
      score: 1,
      weight: 1,
      query: "9780765311788",
      candidate: "9780765311788",
    },
  ])
  const titleOnlyMatch = catalogMatch(0.9, [
    {
      field: "title",
      score: 0.9,
      weight: 0.8,
      query: "Mistborn",
      candidate: "Mistborn: The Final Empire",
    },
  ])
  const resolvedFirstPage: BookMetadata = {
    type: "file",
    contentType: "application/x-cbz",
    metadata: { cover: { uri: "page-001.avif", confidence: "assumed" } },
  }
  const resolvedDeclaredCover: BookMetadata = {
    type: "file",
    contentType: "application/epub+zip",
    metadata: { cover: { uri: "OEBPS/cover.jpg", confidence: "derived" } },
  }

  it("prefers a match an identifier confirmed over the archive's first page", () => {
    expect(
      pickCoverMetadata([confirmedMatch, resolvedFirstPage], undefined),
    ).toBe(confirmedMatch)
  })

  it("does not treat a title match as confirmed", () => {
    expect(
      pickCoverMetadata([titleOnlyMatch, resolvedFirstPage], undefined),
    ).toBe(resolvedFirstPage)
  })

  it("reads the archive's declared cover as certain", () => {
    expect(
      pickCoverMetadata(
        [titleOnlyMatch, resolvedDeclaredCover],
        ["catalog", "file"],
      ),
    ).toBe(resolvedDeclaredCover)
  })

  it("ranks a legacy catalog entry where the priority puts the catalog", () => {
    expect(
      pickCoverMetadata([googleCover, firstPage], ["catalog", "file"]),
    ).toBe(googleCover)
  })
})
