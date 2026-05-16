// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import {
  parseComicInfo,
  resolveArchiveMetadata,
} from "@prose-reader/archive-parser"
import type { ArchiveEntry, ArchiveSource } from "../archive/types"
import {
  COMIC_INFO_FILENAME,
  buildPatchedComicInfoXml,
  findComicInfoEntry,
} from "./index"

const makeArchive = (
  files: Record<string, string>,
  options: { directories?: string[] } = {},
): ArchiveSource => {
  const directoryEntries: ArchiveEntry[] = (options.directories ?? []).map(
    (path) => ({
      path,
      isDir: true,
      readAsString: () => Promise.reject(new Error("dir entry")),
      readAsUint8Array: () => Promise.reject(new Error("dir entry")),
    }),
  )

  const fileEntries: ArchiveEntry[] = Object.entries(files).map(
    ([path, body]) => ({
      path,
      isDir: false,
      readAsString: () => Promise.resolve(body),
      readAsUint8Array: () => Promise.resolve(new TextEncoder().encode(body)),
    }),
  )

  return {
    listEntries: () => Promise.resolve([...directoryEntries, ...fileEntries]),
  }
}

const minimalComicInfo = (body = "") =>
  `<?xml version="1.0" encoding="utf-8"?>` +
  `<ComicInfo xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ` +
  `xmlns:xsd="http://www.w3.org/2001/XMLSchema">${body}</ComicInfo>`

const readComicInfoIsbn = (xml: string): string | undefined =>
  resolveArchiveMetadata(parseComicInfo(xml)).isbn

describe("ComicInfo detection (findComicInfoEntry)", () => {
  it("finds ComicInfo.xml at the archive root", async () => {
    const archive = makeArchive({
      "ComicInfo.xml": minimalComicInfo(),
      "page-001.jpg": "binary",
    })

    const entry = await findComicInfoEntry(archive)

    expect(entry?.path).toBe("ComicInfo.xml")
  })

  it("matches the filename case-insensitively", async () => {
    const archive = makeArchive({ "ComicInfo.XML": minimalComicInfo() })

    const entry = await findComicInfoEntry(archive)

    expect(entry?.path).toBe("ComicInfo.XML")
  })

  it("ignores ComicInfo files nested inside sub-folders", async () => {
    const archive = makeArchive({
      "meta/ComicInfo.xml": minimalComicInfo(),
      "deep/nested/comicinfo.xml": minimalComicInfo(),
    })

    const entry = await findComicInfoEntry(archive)

    expect(entry).toBeUndefined()
  })

  it("returns undefined when there is no ComicInfo entry at all", async () => {
    const archive = makeArchive({
      "page-001.jpg": "binary",
      "page-002.jpg": "binary",
    })

    const entry = await findComicInfoEntry(archive)

    expect(entry).toBeUndefined()
  })

  it("skips a directory entry that happens to be named ComicInfo.xml", async () => {
    const archive = makeArchive(
      { "page-001.jpg": "binary" },
      { directories: ["ComicInfo.xml/"] },
    )

    const entry = await findComicInfoEntry(archive)

    expect(entry).toBeUndefined()
  })

  it("returns the first matching root-level file when several casings co-exist", async () => {
    const archive = makeArchive({
      "ComicInfo.xml": minimalComicInfo("<Title>first</Title>"),
      "comicinfo.xml": minimalComicInfo("<Title>second</Title>"),
    })

    const entry = await findComicInfoEntry(archive)

    expect(entry?.path).toBe("ComicInfo.xml")
  })
})

describe("ComicInfo editing (buildPatchedComicInfoXml)", () => {
  it("synthesises a minimal ComicInfo document when the archive has none", async () => {
    const archive = makeArchive({ "page-001.jpg": "binary" })

    const xml = await buildPatchedComicInfoXml(archive, {
      isbn: "9783161484100",
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

  it("emits no GTIN element when synthesising with an undefined ISBN", async () => {
    const archive = makeArchive({ "page-001.jpg": "binary" })

    const xml = await buildPatchedComicInfoXml(archive, { isbn: undefined })

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
      isbn: "9783161484100",
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
      isbn: "9783161484100",
    })

    const matches = xml.match(/<GTIN>/g) ?? []
    expect(matches).toHaveLength(1)
    expect(xml).toContain("<GTIN>9783161484100</GTIN>")
    expect(xml).not.toContain("<GTIN>0000000000</GTIN>")
  })

  it("removes the GTIN element when the patch clears it", async () => {
    const archive = makeArchive({
      "ComicInfo.xml": minimalComicInfo(
        "<Title>Sample</Title><GTIN>9783161484100</GTIN>",
      ),
    })

    const xml = await buildPatchedComicInfoXml(archive, { isbn: undefined })

    expect(xml).not.toContain("<GTIN")
    expect(xml).toContain("<Title>Sample</Title>")
    expect(readComicInfoIsbn(xml)).toBeUndefined()
  })

  it("locates the existing ComicInfo.xml regardless of its filename casing", async () => {
    const archive = makeArchive({
      "comicinfo.xml": minimalComicInfo("<Title>Sample</Title>"),
    })

    const xml = await buildPatchedComicInfoXml(archive, {
      isbn: "9783161484100",
    })

    expect(xml).toContain("<Title>Sample</Title>")
    expect(xml).toContain("<GTIN>9783161484100</GTIN>")
  })

  it("overwrites a malformed existing ComicInfo with a freshly synthesised document", async () => {
    const archive = makeArchive({
      "ComicInfo.xml": "<ComicInfo><GTIN>oops",
    })

    const xml = await buildPatchedComicInfoXml(archive, {
      isbn: "9783161484100",
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
      buildPatchedComicInfoXml(archive, { isbn: "9783161484100" }),
    ).rejects.toThrow(/root element is not <ComicInfo>/i)
  })

  it("emits an XML declaration even when the existing document has none", async () => {
    const archive = makeArchive({
      "ComicInfo.xml": "<ComicInfo><Title>Sample</Title></ComicInfo>",
    })

    const xml = await buildPatchedComicInfoXml(archive, {
      isbn: "9783161484100",
    })

    expect(xml.startsWith("<?xml")).toBe(true)
  })

  it("uses the canonical filename constant for the writable path", () => {
    expect(COMIC_INFO_FILENAME).toBe("ComicInfo.xml")
  })
})
