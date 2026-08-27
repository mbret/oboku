// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { EMPTY_BOOK_OPTIMIZE_FORM_VALUES } from "../form"
import type { FileInspection } from "../useFileInspection"
import {
  CONTAINER_XML,
  comicInfo,
  inspect,
  opf,
} from "../metadata/identifiers/inspection.fixture"
import { buildUpdateActions } from "./buildUpdateActions"

const metadataPatch = (isbn: string, inspection: FileInspection) => {
  const [action] = buildUpdateActions(
    { ...EMPTY_BOOK_OPTIMIZE_FORM_VALUES, isbn },
    inspection,
  )

  if (action?.kind !== "patch-metadata") {
    throw new Error("expected a patch-metadata action")
  }

  return action
}

describe("buildUpdateActions, the metadata patch it plans", () => {
  it("carries the identifiers it is not editing through the patch", async () => {
    const inspection = await inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opf(
        '<dc:identifier id="pub-id">urn:uuid:A1B0D67E-2E81-4DF5-9E67-A64CBE366809</dc:identifier>' +
          '<dc:identifier opf:scheme="ISBN">0000000000</dc:identifier>' +
          '<dc:identifier opf:scheme="DOI">10.1000/182</dc:identifier>',
      ),
    })

    const { patch } = metadataPatch("9783161484100", inspection)

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

    const { patch } = metadataPatch("9783161484100", inspection)

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

    const { patch } = metadataPatch("", inspection)

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

    const { patch, targets } = metadataPatch("9783161484100", inspection)

    expect(patch.identifiers).toEqual([
      { scheme: "GTIN", value: "9783161484100", unique: false },
    ])
    expect(targets).toEqual({ comicInfo: true, opf: false })
  })
})

describe("buildUpdateActions, an ISBN both containers announce", () => {
  const bothAnnounce = () =>
    inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opf(
        '<dc:identifier id="pub-id">urn:uuid:A1B0D67E-2E81-4DF5-9E67-A64CBE366809</dc:identifier>' +
          '<dc:identifier opf:scheme="ISBN">9783161484100</dc:identifier>',
      ),
      "ComicInfo.xml": comicInfo("<GTIN>9783161484100</GTIN>"),
    })

  it("leaves the previous ISBN behind under no scheme", async () => {
    const { patch } = metadataPatch("9780306406157", await bothAnnounce())

    expect(patch.identifiers).toEqual([
      {
        scheme: "Unknown",
        value: "urn:uuid:A1B0D67E-2E81-4DF5-9E67-A64CBE366809",
        unique: true,
      },
      { scheme: "ISBN", value: "9780306406157", unique: false },
    ])
  })

  it("clears every entry announcing it", async () => {
    const { patch } = metadataPatch("", await bothAnnounce())

    expect(patch.identifiers).toEqual([
      {
        scheme: "Unknown",
        value: "urn:uuid:A1B0D67E-2E81-4DF5-9E67-A64CBE366809",
        unique: true,
      },
    ])
  })
})

describe("buildUpdateActions, what it asks to be removed", () => {
  it("names nothing when the edit only changes a value", async () => {
    const inspection = await inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opf(
        '<dc:identifier opf:scheme="ISBN">0000000000</dc:identifier>' +
          '<dc:identifier opf:scheme="DOI">10.1000/182</dc:identifier>',
      ),
    })

    const { patch } = metadataPatch("9783161484100", inspection)

    expect(patch.removedIdentifiers).toEqual([])
    expect(patch.identifiers).toEqual([
      { scheme: "ISBN", value: "9783161484100", unique: false },
      { scheme: "DOI", value: "10.1000/182", unique: false },
    ])
  })

  it("names the ISBN it dropped when the field is cleared", async () => {
    const inspection = await inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opf(
        '<dc:identifier opf:scheme="ISBN">9783161484100</dc:identifier>' +
          '<dc:identifier opf:scheme="DOI">10.1000/182</dc:identifier>',
      ),
    })

    const { patch } = metadataPatch("", inspection)

    expect(patch.removedIdentifiers).toEqual([
      { scheme: "ISBN", value: "9783161484100", unique: false },
    ])
    expect(patch.identifiers).toEqual([
      { scheme: "DOI", value: "10.1000/182", unique: false },
    ])
  })

  it("names both entries when the containers each announced the ISBN", async () => {
    const inspection = await inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opf(
        '<dc:identifier opf:scheme="ISBN">9783161484100</dc:identifier>',
      ),
      "ComicInfo.xml": comicInfo("<GTIN>9783161484100</GTIN>"),
    })

    const { patch } = metadataPatch("9780306406157", inspection)

    expect(patch.identifiers).toEqual([
      { scheme: "ISBN", value: "9780306406157", unique: false },
    ])
    expect(patch.removedIdentifiers).toEqual([
      { scheme: "GTIN", value: "9783161484100", unique: false },
    ])
  })
})
