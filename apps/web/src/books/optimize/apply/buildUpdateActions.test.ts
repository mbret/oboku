// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { EMPTY_BOOK_OPTIMIZE_FORM_VALUES } from "../form"
import type { MetadataIdentifierFormValue } from "../metadata/formValues"
import type { FileInspection } from "../useFileInspection"
import {
  CONTAINER_XML,
  comicInfo,
  inspect,
  opf,
} from "../metadata/identifiers/inspection.fixture"
import { buildUpdateActions } from "./buildUpdateActions"

const actionsFor = (
  identifiers: MetadataIdentifierFormValue[],
  inspection: FileInspection,
) =>
  buildUpdateActions(
    { ...EMPTY_BOOK_OPTIMIZE_FORM_VALUES, identifiers },
    inspection,
  )

const GOOGLE_BOOKS: MetadataIdentifierFormValue = {
  scheme: "GoogleBooks",
  value: "zyTCAlFPjgYC",
  unique: false,
}

describe("buildUpdateActions, the metadata patch it plans", () => {
  it("targets the containers the archive carries", async () => {
    const withOpf = await inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opf("<dc:title>Sample</dc:title>"),
    })
    const withoutOpf = await inspect({ "page-001.jpg": "binary" })

    expect(actionsFor([GOOGLE_BOOKS], withOpf)).toEqual([
      {
        kind: "patch-metadata",
        patch: { identifiers: [GOOGLE_BOOKS], removedIdentifiers: [] },
        targets: { comicInfo: false, opf: true },
      },
    ])
    expect(actionsFor([GOOGLE_BOOKS], withoutOpf)).toEqual([
      {
        kind: "patch-metadata",
        patch: { identifiers: [GOOGLE_BOOKS], removedIdentifiers: [] },
        targets: { comicInfo: true, opf: false },
      },
    ])
  })

  it("plans nothing when the identifiers are untouched", async () => {
    const inspection = await inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opf(
        '<dc:identifier opf:scheme="ISBN">9783161484100</dc:identifier>',
      ),
    })

    expect(
      actionsFor(
        [{ scheme: "ISBN", value: "9783161484100", unique: false }],
        inspection,
      ),
    ).toEqual([])
  })

  it("plans a patch for an edited value, a new row and a removed row", async () => {
    const inspection = await inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opf(
        '<dc:identifier opf:scheme="ISBN">9783161484100</dc:identifier>',
      ),
    })
    const isbn: MetadataIdentifierFormValue = {
      scheme: "ISBN",
      value: "9783161484100",
      unique: false,
    }

    expect(
      actionsFor([{ ...isbn, value: "9780306406157" }], inspection),
    ).toHaveLength(1)
    expect(actionsFor([isbn, GOOGLE_BOOKS], inspection)).toHaveLength(1)
    expect(actionsFor([], inspection)).toHaveLength(1)
  })

  it("plans nothing for a book with nowhere to store identifiers", async () => {
    const inspection = await inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": "<root><child></wrong></root>",
    })

    expect(actionsFor([GOOGLE_BOOKS], inspection)).toEqual([])
  })
})

describe("buildUpdateActions, what it asks to be removed", () => {
  const patchFor = async (
    rows: MetadataIdentifierFormValue[],
    files: Record<string, string>,
  ) => {
    const [action] = actionsFor(rows, await inspect(files))

    if (action?.kind !== "patch-metadata") {
      throw new Error("expected a patch-metadata action")
    }

    return action.patch
  }

  const ISBN: MetadataIdentifierFormValue = {
    scheme: "ISBN",
    value: "9783161484100",
    unique: false,
  }
  const DOI: MetadataIdentifierFormValue = {
    scheme: "DOI",
    value: "10.1000/182",
    unique: false,
  }

  it("names nothing when a row only changes its value", async () => {
    const patch = await patchFor([{ ...ISBN, value: "9780306406157" }, DOI], {
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opf(
        '<dc:identifier opf:scheme="ISBN">9783161484100</dc:identifier>' +
          '<dc:identifier opf:scheme="DOI">10.1000/182</dc:identifier>',
      ),
    })

    expect(patch.removedIdentifiers).toEqual([])
  })

  it("names the identifier whose row was deleted", async () => {
    const patch = await patchFor([DOI], {
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opf(
        '<dc:identifier opf:scheme="ISBN">9783161484100</dc:identifier>' +
          '<dc:identifier opf:scheme="DOI">10.1000/182</dc:identifier>',
      ),
    })

    expect(patch.removedIdentifiers).toEqual([
      { scheme: "ISBN", value: "9783161484100" },
    ])
  })

  it("names both entries the one row stood for", async () => {
    const patch = await patchFor([], {
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opf(
        '<dc:identifier opf:scheme="ISBN">9783161484100</dc:identifier>',
      ),
      "ComicInfo.xml": comicInfo("<GTIN>9783161484100</GTIN>"),
    })

    expect(patch.removedIdentifiers).toEqual([
      { scheme: "ISBN", value: "9783161484100" },
      { scheme: "GTIN", value: "9783161484100" },
    ])
  })

  it("names nothing for the row that stands for both", async () => {
    const patch = await patchFor([ISBN], {
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opf(
        '<dc:identifier opf:scheme="ISBN">9783161484100</dc:identifier>' +
          '<dc:identifier opf:scheme="DOI">10.1000/182</dc:identifier>',
      ),
      "ComicInfo.xml": comicInfo("<GTIN>9783161484100</GTIN>"),
    })

    expect(patch.removedIdentifiers).toEqual([
      { scheme: "DOI", value: "10.1000/182" },
    ])
  })
})
