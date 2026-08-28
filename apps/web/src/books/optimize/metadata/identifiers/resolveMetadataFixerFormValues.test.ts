// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { resolveMetadataFixerFormValues } from "./resolveMetadataFixerFormValues"
import { CONTAINER_XML, comicInfo, inspect, opf } from "./inspection.fixture"

describe("resolveMetadataFixerFormValues", function testSeeding() {
  it("seeds a row per identifier the containers carry", async function seedRows() {
    const inspection = await inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opf(
        '<dc:identifier opf:scheme="ISBN">9783161484100</dc:identifier>' +
          '<dc:identifier opf:scheme="GoogleBooks">zyTCAlFPjgYC</dc:identifier>',
      ),
    })

    expect(resolveMetadataFixerFormValues(inspection).identifiers).toEqual([
      { scheme: "ISBN", value: "9783161484100", unique: false },
      { scheme: "GoogleBooks", value: "zyTCAlFPjgYC", unique: false },
    ])
  })

  it("marks the identifier the package points at as unique", async function flagUniqueIdentifier() {
    const inspection = await inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opf(
        '<dc:identifier id="pub-id" opf:scheme="ISBN">9783161484100</dc:identifier>',
      ),
    })

    expect(resolveMetadataFixerFormValues(inspection).identifiers).toEqual([
      { scheme: "ISBN", value: "9783161484100", unique: true },
    ])
  })

  it("collapses the ISBN and the ComicInfo GTIN holding it into one row", async function dedupeIsbnBearingSchemes() {
    const inspection = await inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opf(
        '<dc:identifier opf:scheme="ISBN">9783161484100</dc:identifier>',
      ),
      "ComicInfo.xml": comicInfo("<GTIN>9783161484100</GTIN>"),
    })

    expect(resolveMetadataFixerFormValues(inspection).identifiers).toEqual([
      { scheme: "ISBN", value: "9783161484100", unique: false },
    ])
  })

  it("folds a ComicInfo catalog link back to the scheme it stands for", async function seedCatalogLink() {
    const inspection = await inspect({
      "ComicInfo.xml": comicInfo(
        "<Web>https://books.google.com/books?id=zyTCAlFPjgYC</Web>",
      ),
      "page-001.jpg": "binary",
    })

    expect(resolveMetadataFixerFormValues(inspection).identifiers).toEqual([
      { scheme: "GoogleBooks", value: "zyTCAlFPjgYC", unique: false },
    ])
  })

  it("collapses the OPF identifier and the ComicInfo link holding it", async function dedupeCatalogLink() {
    const inspection = await inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opf(
        '<dc:identifier opf:scheme="GoogleBooks">zyTCAlFPjgYC</dc:identifier>',
      ),
      "ComicInfo.xml": comicInfo(
        "<Web>https://books.google.com/books?id=zyTCAlFPjgYC</Web>",
      ),
    })

    expect(resolveMetadataFixerFormValues(inspection).identifiers).toEqual([
      { scheme: "GoogleBooks", value: "zyTCAlFPjgYC", unique: false },
    ])
  })

  it("canonicalizes a catalog id to the spelling its catalog addresses by", async function canonicalizeCatalogValue() {
    const inspection = await inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opf(
        '<dc:identifier opf:scheme="OpenLibrary">OL7353617M</dc:identifier>',
      ),
    })

    expect(resolveMetadataFixerFormValues(inspection).identifiers).toEqual([
      { scheme: "OpenLibrary", value: "/books/OL7353617M", unique: false },
    ])
  })

  it("collapses a bare catalog id and the link holding it into one row", async function dedupeAcrossSpellings() {
    const inspection = await inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opf(
        '<dc:identifier opf:scheme="OpenLibrary">OL7353617M</dc:identifier>',
      ),
      "ComicInfo.xml": comicInfo(
        "<Web>https://openlibrary.org/books/OL7353617M</Web>",
      ),
    })

    expect(resolveMetadataFixerFormValues(inspection).identifiers).toEqual([
      { scheme: "OpenLibrary", value: "/books/OL7353617M", unique: false },
    ])
  })

  it("leaves a link no catalog claims as a URL", async function seedPlainLink() {
    const inspection = await inspect({
      "ComicInfo.xml": comicInfo("<Web>https://example.com/a</Web>"),
      "page-001.jpg": "binary",
    })

    expect(resolveMetadataFixerFormValues(inspection).identifiers).toEqual([
      { scheme: "URL", value: "https://example.com/a", unique: false },
    ])
  })

  it("keeps a ComicInfo-only GTIN under its own scheme", async function seedComicInfoGtin() {
    const inspection = await inspect({
      "ComicInfo.xml": comicInfo("<GTIN>9783161484100</GTIN>"),
      "page-001.jpg": "binary",
    })

    expect(resolveMetadataFixerFormValues(inspection).identifiers).toEqual([
      { scheme: "GTIN", value: "9783161484100", unique: false },
    ])
  })
})
