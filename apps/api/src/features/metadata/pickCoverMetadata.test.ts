import type { BookMetadata } from "@oboku/shared"
import { describe, expect, it } from "vitest"
import { pickCoverMetadata } from "./pickCoverMetadata"

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
      pickCoverMetadata([googleCover, firstPage], undefined, {
        catalogIdentityIsConfirmed: true,
      }),
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
      pickCoverMetadata([{ type: "googleBookApi" }, firstPage], undefined, {
        catalogIdentityIsConfirmed: true,
      }),
    ).toBe(firstPage)
  })
})

describe("pickCoverMetadata, when both sources are certain", () => {
  it("defers to the priority order", () => {
    expect(
      pickCoverMetadata([googleCover, declaredCover], undefined, {
        catalogIdentityIsConfirmed: true,
      }),
    ).toBe(declaredCover)

    expect(
      pickCoverMetadata(
        [googleCover, declaredCover],
        ["googleBookApi", "file"],
        {
          catalogIdentityIsConfirmed: true,
        },
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
      pickCoverMetadata([googleCover, unknownCover], undefined, {
        catalogIdentityIsConfirmed: true,
      }),
    ).toBe(googleCover)
  })

  it("still uses it when no source is certain", () => {
    expect(pickCoverMetadata([googleCover, unknownCover], undefined)).toBe(
      unknownCover,
    )
  })
})
