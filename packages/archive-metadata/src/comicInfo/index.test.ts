// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import {
  arrayBufferFileAccessors,
  catalogIdentifierFromUrl,
  createArchive,
  getArchiveHasComicInfo,
  identifierValue,
  parseComicInfo,
  resolveArchiveMetadata,
} from "@prose-reader/archive-reader"
import type { Archive, ArchiveRecord } from "../archive/types"
import {
  COMIC_INFO_FILENAME,
  buildPatchedComicInfoXml,
  isComicInfoWritableIdentifierScheme,
} from "./index"

const basename = (uri: string): string =>
  uri.split("/").filter(Boolean).pop() ?? uri

const toArrayBuffer = (body: string): ArrayBuffer => {
  const bytes = new TextEncoder().encode(body)
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)

  return buffer
}

const makeArchive = (
  files: Record<string, string>,
  options: { directories?: string[] } = {},
): Archive => {
  const directoryRecords = (options.directories ?? []).map(
    (uri): ArchiveRecord => ({
      dir: true,
      basename: basename(uri),
      uri,
    }),
  )

  const fileRecords = Object.entries(files).map(
    ([uri, body]): ArchiveRecord => ({
      dir: false,
      basename: basename(uri),
      uri,
      size: body.length,
      ...arrayBufferFileAccessors(() => Promise.resolve(toArrayBuffer(body))),
    }),
  )

  return createArchive({
    filename: "test.zip",
    records: [...directoryRecords, ...fileRecords],
    close: () => Promise.resolve(),
  })
}

const minimalComicInfo = (body = "") =>
  `<?xml version="1.0" encoding="utf-8"?>` +
  `<ComicInfo xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ` +
  `xmlns:xsd="http://www.w3.org/2001/XMLSchema">${body}</ComicInfo>`

const readComicInfoIsbn = (xml: string): string | undefined =>
  identifierValue(
    resolveArchiveMetadata(parseComicInfo(xml)).identifiers,
    "ISBN",
  )

describe("ComicInfo detection (getArchiveHasComicInfo)", () => {
  it("finds ComicInfo.xml at the archive root", async () => {
    const archive = makeArchive({
      "ComicInfo.xml": minimalComicInfo(),
      "page-001.jpg": "binary",
    })

    const entry = getArchiveHasComicInfo(archive)

    expect(entry?.uri).toBe("ComicInfo.xml")
  })

  it("matches the filename case-insensitively", async () => {
    const archive = makeArchive({ "ComicInfo.XML": minimalComicInfo() })

    const entry = getArchiveHasComicInfo(archive)

    expect(entry?.uri).toBe("ComicInfo.XML")
  })

  it("finds a ComicInfo nested inside a sub-folder", async () => {
    const archive = makeArchive({
      "meta/ComicInfo.xml": minimalComicInfo(),
    })

    const entry = getArchiveHasComicInfo(archive)

    expect(entry?.uri).toBe("meta/ComicInfo.xml")
  })

  it("returns undefined when there is no ComicInfo entry at all", async () => {
    const archive = makeArchive({
      "page-001.jpg": "binary",
      "page-002.jpg": "binary",
    })

    const entry = getArchiveHasComicInfo(archive)

    expect(entry).toBeUndefined()
  })

  it("skips a directory entry that happens to be named ComicInfo.xml", async () => {
    const archive = makeArchive(
      { "page-001.jpg": "binary" },
      { directories: ["ComicInfo.xml/"] },
    )

    const entry = getArchiveHasComicInfo(archive)

    expect(entry).toBeUndefined()
  })

  it("returns the first matching file when several casings co-exist", async () => {
    const archive = makeArchive({
      "ComicInfo.xml": minimalComicInfo("<Title>first</Title>"),
      "comicinfo.xml": minimalComicInfo("<Title>second</Title>"),
    })

    const entry = getArchiveHasComicInfo(archive)

    expect(entry?.uri).toBe("ComicInfo.xml")
  })
})

describe("ComicInfo editing (buildPatchedComicInfoXml)", () => {
  it("synthesises a minimal ComicInfo document when the archive has none", async () => {
    const archive = makeArchive({ "page-001.jpg": "binary" })

    const xml = await buildPatchedComicInfoXml(archive, {
      identifiers: [{ scheme: "ISBN", value: "9783161484100" }],
    })

    expect(xml.startsWith("<?xml")).toBe(true)
    expect(xml).toContain("<ComicInfo")
    expect(xml).toContain(
      'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
    )
    expect(xml).toContain('xmlns:xsd="http://www.w3.org/2001/XMLSchema"')
    expect(xml).toContain("<GTIN>9783161484100</GTIN>")
    expect(readComicInfoIsbn(xml)).toBe("9783161484100")
  })

  it("emits no GTIN element when synthesising without any identifier", async () => {
    const archive = makeArchive({ "page-001.jpg": "binary" })

    const xml = await buildPatchedComicInfoXml(archive, { identifiers: [] })

    expect(xml).not.toContain("<GTIN")
    expect(readComicInfoIsbn(xml)).toBeUndefined()
  })

  it("inserts a GTIN into an existing ComicInfo document and preserves siblings", async () => {
    const archive = makeArchive({
      "ComicInfo.xml": minimalComicInfo(
        "<Title>Sample</Title>" +
          "<Series>Sample Series</Series>" +
          "<Number>1</Number>" +
          "<Writer>Alice</Writer>",
      ),
    })

    const xml = await buildPatchedComicInfoXml(archive, {
      identifiers: [{ scheme: "ISBN", value: "9783161484100" }],
    })

    expect(xml).toContain("<Title>Sample</Title>")
    expect(xml).toContain("<Series>Sample Series</Series>")
    expect(xml).toContain("<Number>1</Number>")
    expect(xml).toContain("<Writer>Alice</Writer>")
    expect(xml).toContain("<GTIN>9783161484100</GTIN>")
  })

  it("replaces an existing GTIN value rather than appending a duplicate", async () => {
    const archive = makeArchive({
      "ComicInfo.xml": minimalComicInfo(
        "<Title>Sample</Title><GTIN>0000000000</GTIN>",
      ),
    })

    const xml = await buildPatchedComicInfoXml(archive, {
      identifiers: [{ scheme: "ISBN", value: "9783161484100" }],
    })

    const matches = xml.match(/<GTIN>/g) ?? []
    expect(matches).toHaveLength(1)
    expect(xml).toContain("<GTIN>9783161484100</GTIN>")
    expect(xml).not.toContain("<GTIN>0000000000</GTIN>")
  })

  it("stores a GTIN-scheme identifier in the same element as an ISBN", async () => {
    const archive = makeArchive({ "page-001.jpg": "binary" })

    const xml = await buildPatchedComicInfoXml(archive, {
      identifiers: [{ scheme: "GTIN", value: "9783161484100" }],
    })

    expect(xml).toContain("<GTIN>9783161484100</GTIN>")
  })

  it("stores URL identifiers as a space-separated Web element", async () => {
    const archive = makeArchive({ "page-001.jpg": "binary" })

    const xml = await buildPatchedComicInfoXml(archive, {
      identifiers: [
        { scheme: "URL", value: "https://example.com/a" },
        { scheme: "URL", value: "https://example.com/b" },
      ],
    })

    expect(xml).toContain(
      "<Web>https://example.com/a https://example.com/b</Web>",
    )
  })

  it("removes the Web element when the patch names its only link", async () => {
    const archive = makeArchive({
      "ComicInfo.xml": minimalComicInfo("<Web>https://example.com/a</Web>"),
    })

    const xml = await buildPatchedComicInfoXml(archive, {
      identifiers: [],
      removedIdentifiers: [{ scheme: "URL", value: "https://example.com/a" }],
    })

    expect(xml).not.toContain("<Web")
  })

  it("keeps a link the patch names in neither list", async () => {
    const archive = makeArchive({
      "ComicInfo.xml": minimalComicInfo("<Web>https://example.com/a</Web>"),
    })

    const xml = await buildPatchedComicInfoXml(archive, { identifiers: [] })

    expect(xml).toContain("https://example.com/a")
  })

  it("keeps a Web token its reader does not report as an identifier", async () => {
    const archive = makeArchive({
      "ComicInfo.xml": minimalComicInfo(
        "<Web>https://example.com/a not-a-url</Web>",
      ),
    })

    const xml = await buildPatchedComicInfoXml(archive, {
      identifiers: [{ scheme: "URL", value: "https://example.com/b" }],
      removedIdentifiers: [{ scheme: "URL", value: "https://example.com/a" }],
    })

    expect(xml).toContain("not-a-url")
    expect(xml).toContain("https://example.com/b")
    expect(xml).not.toContain("https://example.com/a<")
  })

  it("stores a catalog identifier as its official Web link", async () => {
    const archive = makeArchive({ "page-001.jpg": "binary" })

    const xml = await buildPatchedComicInfoXml(archive, {
      identifiers: [
        { scheme: "GoogleBooks", value: "zyTCAlFPjgYC" },
        { scheme: "ProjectGutenberg", value: "2701" },
      ],
    })

    expect(isComicInfoWritableIdentifierScheme("GoogleBooks")).toBe(true)
    expect(xml).toContain(
      "<Web>https://books.google.com/books?id=zyTCAlFPjgYC " +
        "https://www.gutenberg.org/ebooks/2701</Web>",
    )
  })

  it("keeps plain links alongside the catalog ones", async () => {
    const archive = makeArchive({ "page-001.jpg": "binary" })

    const xml = await buildPatchedComicInfoXml(archive, {
      identifiers: [
        { scheme: "URL", value: "https://example.com/a" },
        { scheme: "GoogleBooks", value: "zyTCAlFPjgYC" },
      ],
    })

    expect(xml).toContain(
      "<Web>https://example.com/a " +
        "https://books.google.com/books?id=zyTCAlFPjgYC</Web>",
    )
  })

  it("stores a DOI and an Open Library key as their resolver links", async () => {
    const archive = makeArchive({ "page-001.jpg": "binary" })

    const xml = await buildPatchedComicInfoXml(archive, {
      identifiers: [
        { scheme: "DOI", value: "10.1000/182" },
        { scheme: "OpenLibrary", value: "/books/OL7353617M" },
      ],
    })

    expect(xml).toContain(
      "<Web>https://doi.org/10.1000/182 " +
        "https://openlibrary.org/books/OL7353617M</Web>",
    )
  })

  it("accepts a bare catalog id, addressing it the way the catalog does", async () => {
    const archive = makeArchive({ "page-001.jpg": "binary" })

    const xml = await buildPatchedComicInfoXml(archive, {
      identifiers: [{ scheme: "OpenLibrary", value: "OL7353617M" }],
    })

    expect(xml).toContain("<Web>https://openlibrary.org/books/OL7353617M</Web>")
  })

  it("has nowhere to store a scheme with neither a GTIN nor a link form", async () => {
    const archive = makeArchive({ "page-001.jpg": "binary" })

    const xml = await buildPatchedComicInfoXml(archive, {
      identifiers: [{ scheme: "AcmeCatalog", value: "acme-42" }],
    })

    expect(isComicInfoWritableIdentifierScheme("AcmeCatalog")).toBe(false)
    expect(xml).not.toContain("acme-42")
  })

  it("will not write a value its catalog cannot address", async () => {
    const archive = makeArchive({ "page-001.jpg": "binary" })

    const xml = await buildPatchedComicInfoXml(archive, {
      identifiers: [{ scheme: "ProjectGutenberg", value: "not-a-number" }],
    })

    expect(xml).not.toContain("not-a-number")
  })

  it("round-trips a catalog identifier through the link the reader parses", async () => {
    const archive = makeArchive({ "page-001.jpg": "binary" })

    const xml = await buildPatchedComicInfoXml(archive, {
      identifiers: [{ scheme: "GoogleBooks", value: "zyTCAlFPjgYC" }],
    })
    const [webIdentifier] =
      resolveArchiveMetadata(parseComicInfo(xml)).identifiers ?? []

    expect(webIdentifier).toEqual({
      value: "https://books.google.com/books?id=zyTCAlFPjgYC",
      scheme: "URL",
    })
    expect(
      webIdentifier && catalogIdentifierFromUrl(webIdentifier.value),
    ).toEqual({ value: "zyTCAlFPjgYC", scheme: "GoogleBooks" })
  })

  it("removes the GTIN element when the patch names what it held", async () => {
    const archive = makeArchive({
      "ComicInfo.xml": minimalComicInfo(
        "<Title>Sample</Title><GTIN>9783161484100</GTIN>",
      ),
    })

    const xml = await buildPatchedComicInfoXml(archive, {
      identifiers: [{ scheme: "DOI", value: "10.1000/182" }],
      removedIdentifiers: [{ scheme: "ISBN", value: "9783161484100" }],
    })

    expect(xml).not.toContain("<GTIN")
    expect(xml).toContain("<Title>Sample</Title>")
    expect(readComicInfoIsbn(xml)).toBeUndefined()
  })

  it("locates the existing ComicInfo.xml regardless of its filename casing", async () => {
    const archive = makeArchive({
      "comicinfo.xml": minimalComicInfo("<Title>Sample</Title>"),
    })

    const xml = await buildPatchedComicInfoXml(archive, {
      identifiers: [{ scheme: "ISBN", value: "9783161484100" }],
    })

    expect(xml).toContain("<Title>Sample</Title>")
    expect(xml).toContain("<GTIN>9783161484100</GTIN>")
  })

  it("overwrites a malformed existing ComicInfo with a freshly synthesised document", async () => {
    const archive = makeArchive({
      "ComicInfo.xml": "<ComicInfo><GTIN>oops",
    })

    const xml = await buildPatchedComicInfoXml(archive, {
      identifiers: [{ scheme: "ISBN", value: "9783161484100" }],
    })

    expect(xml.startsWith("<?xml")).toBe(true)
    expect(xml).toContain("<ComicInfo")
    expect(xml).toContain("<GTIN>9783161484100</GTIN>")
    expect(xml).not.toContain("oops")
    expect(readComicInfoIsbn(xml)).toBe("9783161484100")
  })

  it("throws when the existing root element is not <ComicInfo>", async () => {
    const archive = makeArchive({
      "ComicInfo.xml":
        '<?xml version="1.0" encoding="utf-8"?><NotComicInfo></NotComicInfo>',
    })

    await expect(
      buildPatchedComicInfoXml(archive, {
        identifiers: [{ scheme: "ISBN", value: "9783161484100" }],
      }),
    ).rejects.toThrow(/root element is not <ComicInfo>/i)
  })

  it("emits an XML declaration even when the existing document has none", async () => {
    const archive = makeArchive({
      "ComicInfo.xml": "<ComicInfo><Title>Sample</Title></ComicInfo>",
    })

    const xml = await buildPatchedComicInfoXml(archive, {
      identifiers: [{ scheme: "ISBN", value: "9783161484100" }],
    })

    expect(xml.startsWith("<?xml")).toBe(true)
  })

  it("uses the canonical filename constant for the writable path", () => {
    expect(COMIC_INFO_FILENAME).toBe("ComicInfo.xml")
  })
})
