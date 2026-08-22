import { describe, expect, it } from "vitest"
import { archiveMetadataIsbn } from "./isbn"

describe("archiveMetadataIsbn", () => {
  it("returns undefined when the archive states no identifier", () => {
    expect(archiveMetadataIsbn({})).toBeUndefined()
    expect(archiveMetadataIsbn(undefined)).toBeUndefined()
  })

  it("canonicalizes a hyphenated ISBN identifier", () => {
    expect(
      archiveMetadataIsbn({
        identifiers: [{ value: "978-3-16-148410-0", scheme: "ISBN" }],
      }),
    ).toBe("9783161484100")
  })

  it("strips the urn:isbn prefix publishers wrap identifiers in", () => {
    expect(
      archiveMetadataIsbn({
        identifiers: [{ value: "urn:isbn:9783161484100", scheme: "ISBN" }],
      }),
    ).toBe("9783161484100")
  })

  it("reads an ISBN announced through ComicInfo's GTIN scheme", () => {
    expect(
      archiveMetadataIsbn({
        identifiers: [{ value: "9783161484100", scheme: "GTIN" }],
      }),
    ).toBe("9783161484100")
  })

  it("ignores a GTIN carrying a retail barcode rather than a Bookland ISBN", () => {
    expect(
      archiveMetadataIsbn({
        identifiers: [{ value: "4006381333931", scheme: "GTIN" }],
      }),
    ).toBeUndefined()
  })

  it("ignores identifiers of unrelated schemes", () => {
    expect(
      archiveMetadataIsbn({
        identifiers: [
          {
            value: "urn:uuid:A1B0D67E-2E81-4DF5-9E67-A64CBE366809",
            scheme: "Unknown",
          },
          { value: "https://example.com/book", scheme: "URL" },
        ],
      }),
    ).toBeUndefined()
  })

  it("prefers the first ISBN-bearing identifier, so the OPF wins over a ComicInfo sidecar", () => {
    expect(
      archiveMetadataIsbn({
        identifiers: [
          { value: "0306406152", scheme: "ISBN", unique: true },
          { value: "9783161484100", scheme: "GTIN" },
        ],
      }),
    ).toBe("0306406152")
  })
})
