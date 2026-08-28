import type { BookMetadata } from "@oboku/shared"
import { describe, expect, it } from "vitest"
import { pickCoverMetadata } from "./pickCoverMetadata"

const FILE: BookMetadata = {
  type: "file",
  contentType: "application/x-cbz",
  coverLink: "BLAME! - c001 (v01) - p001.avif",
}
const GOOGLE: BookMetadata = {
  type: "googleBookApi",
  coverLink: "https://books.google.com/books/content?id=Ebb6DQAAQBAJ",
}

describe("pickCoverMetadata", () => {
  it("prefers the archive over the catalog by default", () => {
    expect(pickCoverMetadata([GOOGLE, FILE], undefined)).toBe(FILE)
  })

  it("honors a reordered priority", () => {
    expect(pickCoverMetadata([GOOGLE, FILE], ["googleBookApi", "file"])).toBe(
      GOOGLE,
    )
  })

  it("skips a source carrying no cover", () => {
    expect(pickCoverMetadata([{ type: "file" }, GOOGLE], undefined)).toBe(
      GOOGLE,
    )
  })

  it("prefers the stated volume's cover over the archive's", () => {
    expect(
      pickCoverMetadata([GOOGLE, FILE], undefined, {
        googleVolumeId: "Ebb6DQAAQBAJ",
      }),
    ).toBe(GOOGLE)
  })

  it("prefers the stated volume's cover over a file-first priority", () => {
    expect(
      pickCoverMetadata([GOOGLE, FILE], ["file", "googleBookApi"], {
        googleVolumeId: "Ebb6DQAAQBAJ",
      }),
    ).toBe(GOOGLE)
  })

  it("falls back to the archive when the stated volume yielded no cover", () => {
    expect(
      pickCoverMetadata([FILE], undefined, {
        googleVolumeId: "Ebb6DQAAQBAJ",
      }),
    ).toBe(FILE)
  })

  it("ignores an absent volume id", () => {
    expect(
      pickCoverMetadata([GOOGLE, FILE], undefined, {
        googleVolumeId: undefined,
      }),
    ).toBe(FILE)
  })

  it("returns nothing for an empty list", () => {
    expect(pickCoverMetadata([], undefined)).toBeUndefined()
    expect(pickCoverMetadata(undefined, undefined)).toBeUndefined()
  })
})
