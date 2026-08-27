// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { CONTAINER_XML, comicInfo, inspect, opf } from "./inspection.fixture"
import {
  hasWritableMetadataTarget,
  resolveArchiveMetadataPatchPlan,
  resolveMetadataTargets,
} from "./targets"

const UNPARSEABLE = "<root><child></wrong></root>"

describe("resolveMetadataTargets", () => {
  it("writes only the OPF of an EPUB carrying nothing else", async () => {
    const inspection = await inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opf("<dc:title>Sample</dc:title>"),
    })

    expect(resolveMetadataTargets(inspection)).toEqual({
      comicInfo: false,
      opf: true,
    })
  })

  it("writes both when the EPUB also carries a ComicInfo", async () => {
    const inspection = await inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opf("<dc:title>Sample</dc:title>"),
      "ComicInfo.xml": comicInfo("<Title>Sample</Title>"),
    })

    expect(resolveMetadataTargets(inspection)).toEqual({
      comicInfo: true,
      opf: true,
    })
  })

  it("writes the ComicInfo an archive with no OPF carries", async () => {
    const inspection = await inspect({
      "ComicInfo.xml": comicInfo("<Title>Sample</Title>"),
      "page-001.jpg": "binary",
    })

    expect(resolveMetadataTargets(inspection)).toEqual({
      comicInfo: true,
      opf: false,
    })
  })

  it("creates a ComicInfo for an archive carrying no metadata at all", async () => {
    const inspection = await inspect({ "page-001.jpg": "binary" })

    expect(resolveMetadataTargets(inspection)).toEqual({
      comicInfo: true,
      opf: false,
    })
  })

  it("writes nothing when the OPF cannot be read", async () => {
    const inspection = await inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": UNPARSEABLE,
    })

    expect(resolveMetadataTargets(inspection)).toEqual({
      comicInfo: false,
      opf: false,
    })
    expect(hasWritableMetadataTarget(inspection)).toBe(false)
  })

  it("writes nothing when the OPF cannot be read even alongside a ComicInfo", async () => {
    const inspection = await inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": UNPARSEABLE,
      "ComicInfo.xml": comicInfo("<Title>Sample</Title>"),
    })

    expect(resolveMetadataTargets(inspection)).toEqual({
      comicInfo: false,
      opf: false,
    })
  })

  it("writes nothing when the ComicInfo cannot be read", async () => {
    const inspection = await inspect({
      "ComicInfo.xml": UNPARSEABLE,
      "page-001.jpg": "binary",
    })

    expect(resolveMetadataTargets(inspection)).toEqual({
      comicInfo: false,
      opf: false,
    })
    expect(hasWritableMetadataTarget(inspection)).toBe(false)
  })

  it("writes nothing when the ComicInfo cannot be read even alongside a readable OPF", async () => {
    const inspection = await inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opf("<dc:title>Sample</dc:title>"),
      "ComicInfo.xml": UNPARSEABLE,
    })

    expect(resolveMetadataTargets(inspection)).toEqual({
      comicInfo: false,
      opf: false,
    })
  })
})

describe("resolveArchiveMetadataPatchPlan", () => {
  it("carries the identifiers it is not editing through the patch", async () => {
    const inspection = await inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opf(
        '<dc:identifier id="pub-id">urn:uuid:A1B0D67E-2E81-4DF5-9E67-A64CBE366809</dc:identifier>' +
          '<dc:identifier opf:scheme="ISBN">0000000000</dc:identifier>' +
          '<dc:identifier opf:scheme="DOI">10.1000/182</dc:identifier>',
      ),
    })

    const { patch } = resolveArchiveMetadataPatchPlan(
      { isbn: "9783161484100" },
      inspection,
    )

    expect(patch.identifiers).toEqual([
      {
        scheme: "Unknown",
        value: "urn:uuid:A1B0D67E-2E81-4DF5-9E67-A64CBE366809",
        unique: true,
      },
      { scheme: "ISBN", value: "9783161484100", unique: false },
      { scheme: "DOI", value: "10.1000/182", unique: false },
    ])
  })

  it("appends an ISBN a book announced none of", async () => {
    const inspection = await inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opf(
        '<dc:identifier id="pub-id">urn:uuid:A1B0D67E-2E81-4DF5-9E67-A64CBE366809</dc:identifier>',
      ),
    })

    const { patch } = resolveArchiveMetadataPatchPlan(
      { isbn: "9783161484100" },
      inspection,
    )

    expect(patch.identifiers).toEqual([
      {
        scheme: "Unknown",
        value: "urn:uuid:A1B0D67E-2E81-4DF5-9E67-A64CBE366809",
        unique: true,
      },
      { scheme: "ISBN", value: "9783161484100" },
    ])
  })

  it("drops only the ISBN when the field is cleared", async () => {
    const inspection = await inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opf(
        '<dc:identifier id="pub-id">urn:uuid:A1B0D67E-2E81-4DF5-9E67-A64CBE366809</dc:identifier>' +
          '<dc:identifier opf:scheme="ISBN">9783161484100</dc:identifier>',
      ),
    })

    const { patch } = resolveArchiveMetadataPatchPlan({ isbn: "" }, inspection)

    expect(patch.identifiers).toEqual([
      {
        scheme: "Unknown",
        value: "urn:uuid:A1B0D67E-2E81-4DF5-9E67-A64CBE366809",
        unique: true,
      },
    ])
  })

  it("edits a ComicInfo GTIN as the ISBN it announces", async () => {
    const inspection = await inspect({
      "ComicInfo.xml": comicInfo("<GTIN>0000000000</GTIN>"),
      "page-001.jpg": "binary",
    })

    const { patch, targets } = resolveArchiveMetadataPatchPlan(
      { isbn: "9783161484100" },
      inspection,
    )

    expect(patch.identifiers).toEqual([
      { scheme: "GTIN", value: "9783161484100", unique: false },
    ])
    expect(targets).toEqual({ comicInfo: true, opf: false })
  })
})
