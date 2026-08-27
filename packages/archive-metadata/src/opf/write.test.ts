// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import {
  arrayBufferFileAccessors,
  identifierValue,
  parseOpf,
  resolveArchiveMetadata,
  type ResolvedMetadataIdentifier,
} from "@prose-reader/archive-reader"
import type { ArchiveFileRecord } from "../archive/types"
import { buildPatchedOpfXml } from "./write"

const toArrayBuffer = (body: string): ArrayBuffer => {
  const bytes = new TextEncoder().encode(body)
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)

  return buffer
}

const opf = (
  metadata: string,
  options: { manifest?: string; spine?: string } = {},
): string =>
  '<?xml version="1.0" encoding="utf-8"?>\n' +
  '<package xmlns="http://www.idpf.org/2007/opf"' +
  '         xmlns:dc="http://purl.org/dc/elements/1.1/"' +
  '         xmlns:opf="http://www.idpf.org/2007/opf"' +
  '         version="3.0" unique-identifier="pub-id">\n' +
  `  <metadata>${metadata}</metadata>\n` +
  `  <manifest>${options.manifest ?? ""}</manifest>\n` +
  `  <spine>${options.spine ?? ""}</spine>\n` +
  "</package>"

const makeEntry = (uri: string, body: string): ArchiveFileRecord => ({
  dir: false,
  basename: uri.split("/").filter(Boolean).pop() ?? uri,
  uri,
  size: body.length,
  ...arrayBufferFileAccessors(() => Promise.resolve(toArrayBuffer(body))),
})

const UUID_IDENTIFIER = "urn:uuid:A1B0D67E-2E81-4DF5-9E67-A64CBE366809"

const readOpfMetadata = (xml: string) => resolveArchiveMetadata(parseOpf(xml))

const readOpfIsbn = (xml: string): string | undefined =>
  identifierValue(readOpfMetadata(xml).identifiers, "ISBN")

const readOpfIdentifiers = (
  xml: string,
): ReadonlyArray<ResolvedMetadataIdentifier> =>
  readOpfMetadata(xml).identifiers ?? []

describe("OPF editing (buildPatchedOpfXml)", () => {
  it('inserts a new opf:scheme="ISBN" identifier when the metadata had none', async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf(
        `<dc:identifier id="pub-id">${UUID_IDENTIFIER}</dc:identifier>` +
          "<dc:title>Sample</dc:title>",
      ),
    )

    const xml = await buildPatchedOpfXml(entry, {
      identifiers: [{ scheme: "ISBN", value: "9783161484100" }],
    })

    expect(readOpfIsbn(xml)).toBe("9783161484100")
    expect(xml).toContain(UUID_IDENTIFIER)
    expect(xml).toContain("<dc:title>Sample</dc:title>")
  })

  it('updates the existing opf:scheme="ISBN" identifier in place', async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf(
        `<dc:identifier id="pub-id">${UUID_IDENTIFIER}</dc:identifier>` +
          '<dc:identifier opf:scheme="ISBN">0000000000</dc:identifier>',
      ),
    )

    const xml = await buildPatchedOpfXml(entry, {
      identifiers: [{ scheme: "ISBN", value: "9783161484100" }],
    })

    expect(readOpfIsbn(xml)).toBe("9783161484100")
    expect(xml).not.toContain("0000000000")
  })

  it("matches the scheme attribute case-insensitively when updating", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf('<dc:identifier opf:scheme="isbn">0000000000</dc:identifier>'),
    )

    const xml = await buildPatchedOpfXml(entry, {
      identifiers: [{ scheme: "ISBN", value: "9783161484100" }],
    })

    expect(readOpfIsbn(xml)).toBe("9783161484100")
    expect(xml).not.toContain("0000000000")
  })

  it('reuses a bare scheme="ISBN" attribute rather than switching spelling', async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf('<dc:identifier scheme="ISBN">0000000000</dc:identifier>'),
    )

    const xml = await buildPatchedOpfXml(entry, {
      identifiers: [{ scheme: "ISBN", value: "9783161484100" }],
    })

    expect(readOpfIsbn(xml)).toBe("9783161484100")
    expect(xml).toContain('scheme="ISBN"')
    expect(xml).not.toContain("opf:scheme")
    expect(xml).not.toContain("0000000000")
  })

  it("writes an identifier on any scheme the caller asks for", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf("<dc:title>Sample</dc:title>"),
    )

    const xml = await buildPatchedOpfXml(entry, {
      identifiers: [
        { scheme: "ISBN", value: "9783161484100" },
        { scheme: "GoogleBooks", value: "zyTCAlFPjgYC" },
        { scheme: "AcmeCatalog", value: "acme-42" },
      ],
    })

    expect(readOpfIdentifiers(xml)).toEqual([
      { value: "9783161484100", scheme: "ISBN" },
      { value: "zyTCAlFPjgYC", scheme: "GoogleBooks" },
      { value: "acme-42", scheme: "AcmeCatalog" },
    ])
  })

  it("normalizes a known scheme to its canonical casing", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf("<dc:title>Sample</dc:title>"),
    )

    const xml = await buildPatchedOpfXml(entry, {
      identifiers: [{ scheme: "googlebooks", value: "zyTCAlFPjgYC" }],
    })

    expect(xml).toContain('opf:scheme="GoogleBooks"')
  })

  it("writes an untagged identifier when the scheme is Unknown", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf('<dc:identifier opf:scheme="ISBN">9783161484100</dc:identifier>'),
    )

    const xml = await buildPatchedOpfXml(entry, {
      identifiers: [{ scheme: "Unknown", value: "custom-id" }],
    })

    expect(xml).toContain("<dc:identifier>custom-id</dc:identifier>")
    expect(readOpfIdentifiers(xml)).toEqual([
      { value: "custom-id", scheme: "Unknown" },
    ])
  })

  it("removes the identifiers the patch leaves out", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf(
        '<dc:identifier opf:scheme="ISBN">9783161484100</dc:identifier>' +
          '<dc:identifier opf:scheme="DOI">10.1000/182</dc:identifier>',
      ),
    )

    const xml = await buildPatchedOpfXml(entry, {
      identifiers: [{ scheme: "DOI", value: "10.1000/182" }],
    })

    expect(readOpfIdentifiers(xml)).toEqual([
      { value: "10.1000/182", scheme: "DOI" },
    ])
    expect(xml).not.toContain("9783161484100")
  })

  it("removes every identifier when the patch carries none", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf('<dc:identifier opf:scheme="ISBN">9783161484100</dc:identifier>'),
    )

    const xml = await buildPatchedOpfXml(entry, { identifiers: [] })

    expect(readOpfIdentifiers(xml)).toEqual([])
  })

  it("keeps several identifiers sharing one scheme", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf('<dc:identifier opf:scheme="ISBN">9783161484100</dc:identifier>'),
    )

    const xml = await buildPatchedOpfXml(entry, {
      identifiers: [
        { scheme: "ISBN", value: "9783161484100" },
        { scheme: "ISBN", value: "9780306406157" },
      ],
    })

    expect(readOpfIdentifiers(xml)).toEqual([
      { value: "9783161484100", scheme: "ISBN" },
      { value: "9780306406157", scheme: "ISBN" },
    ])
  })

  it("reuses the element of a scheme so refining metadata keeps resolving", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf(
        '<dc:identifier id="isbn-id" opf:scheme="ISBN">0000000000</dc:identifier>' +
          '<meta refines="#isbn-id" property="identifier-type" scheme="onix:codelist5">15</meta>',
      ),
    )

    const xml = await buildPatchedOpfXml(entry, {
      identifiers: [{ scheme: "ISBN", value: "9783161484100" }],
    })

    expect(xml).toContain('id="isbn-id"')
    expect(xml).toContain('refines="#isbn-id"')
    expect(readOpfIsbn(xml)).toBe("9783161484100")
  })

  it("binds the scheme attribute when the package omits the opf prefix", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      '<?xml version="1.0" encoding="utf-8"?>' +
        '<package xmlns="http://www.idpf.org/2007/opf"' +
        ' xmlns:dc="http://purl.org/dc/elements/1.1/"' +
        ' version="3.0" unique-identifier="pub-id">' +
        `<metadata><dc:identifier id="pub-id">${UUID_IDENTIFIER}</dc:identifier></metadata>` +
        "<manifest/><spine/>" +
        "</package>",
    )

    const xml = await buildPatchedOpfXml(entry, {
      identifiers: [
        { scheme: "Unknown", value: UUID_IDENTIFIER, unique: true },
        { scheme: "ISBN", value: "9783161484100" },
      ],
    })

    expect(readOpfIsbn(xml)).toBe("9783161484100")
    // Re-patching parses the output again, which a document carrying an
    // unbound prefix would fail.
    const repatched = await buildPatchedOpfXml(
      makeEntry("OEBPS/content.opf", xml),
      { identifiers: readOpfIdentifiers(xml) },
    )

    expect(readOpfIsbn(repatched)).toBe("9783161484100")
  })

  it("matches an identifier typed only by a refining meta", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf(
        '<dc:identifier id="gb">zyTCAlFPjgYC</dc:identifier>' +
          '<meta refines="#gb" property="identifier-type">GoogleBooks</meta>',
      ),
    )

    const xml = await buildPatchedOpfXml(entry, {
      identifiers: [{ scheme: "GoogleBooks", value: "otherVolumeId" }],
    })

    expect(readOpfIdentifiers(xml)).toEqual([
      { value: "otherVolumeId", scheme: "GoogleBooks" },
    ])
    expect(xml).toContain('id="gb"')
    expect(xml).toContain('refines="#gb"')
  })

  it("matches an identifier typed by an ONIX identifier-type code", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf(
        '<dc:identifier id="isbn">0000000000</dc:identifier>' +
          '<meta refines="#isbn" property="identifier-type" scheme="onix:codelist5">15</meta>',
      ),
    )

    const xml = await buildPatchedOpfXml(entry, {
      identifiers: [{ scheme: "ISBN", value: "9783161484100" }],
    })

    expect(readOpfIdentifiers(xml)).toEqual([
      { value: "9783161484100", scheme: "ISBN" },
    ])
    expect(xml).toContain('id="isbn"')
  })

  it("removes the metadata refining an identifier it deletes", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf(
        '<dc:identifier opf:scheme="ISBN">9783161484100</dc:identifier>' +
          '<dc:identifier id="doomed" opf:scheme="DOI">10.1000/182</dc:identifier>' +
          '<meta refines="#doomed" property="identifier-type">DOI</meta>' +
          '<meta refines="#doomed" property="display-seq">2</meta>',
      ),
    )

    const xml = await buildPatchedOpfXml(entry, {
      identifiers: [{ scheme: "ISBN", value: "9783161484100" }],
    })

    expect(xml).not.toContain("10.1000/182")
    expect(xml).not.toContain('refines="#doomed"')
  })

  it("never removes the unique-identifier element the patch leaves out", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf(`<dc:identifier id="pub-id">${UUID_IDENTIFIER}</dc:identifier>`),
    )

    const xml = await buildPatchedOpfXml(entry, {
      identifiers: [{ scheme: "ISBN", value: "9783161484100" }],
    })

    expect(xml).toContain(UUID_IDENTIFIER)
    expect(xml).toContain('id="pub-id"')
  })

  it("rewrites the unique-identifier element through the entry marked unique", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf(
        '<dc:identifier id="pub-id" opf:scheme="ISBN">0000000000</dc:identifier>',
      ),
    )

    const xml = await buildPatchedOpfXml(entry, {
      identifiers: [
        { scheme: "ISBN", value: "9783161484100", unique: true },
        { scheme: "GoogleBooks", value: "zyTCAlFPjgYC" },
      ],
    })

    expect(xml).toContain('id="pub-id"')
    expect(readOpfIdentifiers(xml)).toEqual([
      { value: "9783161484100", scheme: "ISBN", unique: true },
      { value: "zyTCAlFPjgYC", scheme: "GoogleBooks" },
    ])
  })

  it("preserves unrelated metadata fields when inserting an identifier", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf(
        "<dc:title>Norwegian Wood</dc:title>" +
          "<dc:creator>Haruki Murakami</dc:creator>" +
          "<dc:publisher>Vintage</dc:publisher>" +
          "<dc:language>en</dc:language>",
      ),
    )

    const xml = await buildPatchedOpfXml(entry, {
      identifiers: [{ scheme: "ISBN", value: "9783161484100" }],
    })

    expect(readOpfMetadata(xml)).toMatchObject({
      titles: [{ value: "Norwegian Wood" }],
      contributors: [{ name: "Haruki Murakami", roles: ["author"] }],
      publication: { edition: { publisher: "Vintage" } },
      languages: ["en"],
    })
    expect(readOpfIsbn(xml)).toBe("9783161484100")
  })

  it("preserves manifest and spine when inserting an identifier", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf("<dc:title>Sample</dc:title>", {
        manifest:
          '<item id="ci" href="cover.png" media-type="image/png" properties="cover-image"/>' +
          '<item id="ch1" href="text/ch1.xhtml" media-type="application/xhtml+xml"/>',
        spine: '<itemref idref="ch1"/>',
      }),
    )

    const xml = await buildPatchedOpfXml(entry, {
      identifiers: [{ scheme: "ISBN", value: "9783161484100" }],
    })

    expect(readOpfIsbn(xml)).toBe("9783161484100")
    expect(xml).toContain(
      '<item id="ci" href="cover.png" media-type="image/png" properties="cover-image"',
    )
    expect(xml).toContain('<itemref idref="ch1"')
  })

  it("emits an XML declaration when the source document had none", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      '<package xmlns="http://www.idpf.org/2007/opf"' +
        '         xmlns:dc="http://purl.org/dc/elements/1.1/"' +
        '         xmlns:opf="http://www.idpf.org/2007/opf"' +
        '         version="3.0" unique-identifier="pub-id">' +
        "<metadata><dc:title>Sample</dc:title></metadata>" +
        "<manifest></manifest>" +
        "<spine></spine>" +
        "</package>",
    )

    const xml = await buildPatchedOpfXml(entry, {
      identifiers: [{ scheme: "ISBN", value: "9783161484100" }],
    })

    expect(xml.startsWith("<?xml")).toBe(true)
  })

  it("throws when the OPF root element is not <package>", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      '<?xml version="1.0" encoding="utf-8"?><notpackage/>',
    )

    await expect(
      buildPatchedOpfXml(entry, {
        identifiers: [{ scheme: "ISBN", value: "9783161484100" }],
      }),
    ).rejects.toThrow(/root element is not <package>/i)
  })

  it("throws when the OPF document has no <metadata> element", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      '<?xml version="1.0" encoding="utf-8"?>' +
        '<package xmlns="http://www.idpf.org/2007/opf"' +
        '         xmlns:dc="http://purl.org/dc/elements/1.1/"' +
        '         xmlns:opf="http://www.idpf.org/2007/opf"' +
        '         version="3.0" unique-identifier="pub-id">' +
        "<manifest></manifest><spine></spine>" +
        "</package>",
    )

    await expect(
      buildPatchedOpfXml(entry, {
        identifiers: [{ scheme: "ISBN", value: "9783161484100" }],
      }),
    ).rejects.toThrow(/has no <metadata> element/i)
  })

  it("propagates a labelled parse error when the OPF is malformed", async () => {
    const entry = makeEntry("OEBPS/content.opf", "<package><metadata>")

    await expect(
      buildPatchedOpfXml(entry, {
        identifiers: [{ scheme: "ISBN", value: "9783161484100" }],
      }),
    ).rejects.toThrow(/OPF is malformed/i)
  })

  it("round-trips: patching the output again is a no-op", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf(`<dc:identifier id="pub-id">${UUID_IDENTIFIER}</dc:identifier>`),
    )
    const identifiers = [
      { scheme: "Unknown", value: UUID_IDENTIFIER, unique: true },
      { scheme: "GoogleBooks", value: "zyTCAlFPjgYC" },
    ]

    const xml = await buildPatchedOpfXml(entry, { identifiers })
    const repatched = await buildPatchedOpfXml(
      makeEntry("OEBPS/content.opf", xml),
      { identifiers: readOpfIdentifiers(xml) },
    )

    expect(readOpfIdentifiers(repatched)).toEqual(readOpfIdentifiers(xml))
    expect(readOpfIdentifiers(xml)).toEqual([
      { value: UUID_IDENTIFIER, scheme: "Unknown", unique: true },
      { value: "zyTCAlFPjgYC", scheme: "GoogleBooks" },
    ])
  })
})

describe("OPF editing across container spellings", () => {
  it("patches a package that prefixes the OPF namespace", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      '<?xml version="1.0" encoding="utf-8"?>' +
        '<opf:package xmlns:opf="http://www.idpf.org/2007/opf"' +
        ' xmlns:dc="http://purl.org/dc/elements/1.1/"' +
        ' version="3.0" unique-identifier="pub-id">' +
        "<opf:metadata><dc:title>Sample</dc:title></opf:metadata>" +
        "<opf:manifest/><opf:spine/></opf:package>",
    )

    const xml = await buildPatchedOpfXml(entry, {
      identifiers: [{ scheme: "ISBN", value: "9783161484100" }],
    })

    expect(readOpfIsbn(xml)).toBe("9783161484100")
    expect(xml).toContain("<dc:title>Sample</dc:title>")
  })

  it("updates an unprefixed <identifier> under a default DC namespace", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      '<?xml version="1.0" encoding="utf-8"?>' +
        '<package xmlns="http://www.idpf.org/2007/opf"' +
        ' xmlns:opf="http://www.idpf.org/2007/opf"' +
        ' version="3.0" unique-identifier="pub-id">' +
        '<metadata xmlns="http://purl.org/dc/elements/1.1/">' +
        '<identifier opf:scheme="ISBN">0000000000</identifier>' +
        "</metadata><manifest/><spine/></package>",
    )

    const xml = await buildPatchedOpfXml(entry, {
      identifiers: [{ scheme: "ISBN", value: "9783161484100" }],
    })

    expect(readOpfIsbn(xml)).toBe("9783161484100")
    expect(readOpfIdentifiers(xml)).toHaveLength(1)
    expect(xml).not.toContain("0000000000")
  })

  it("reuses a capitalized opf:Scheme attribute rather than switching spelling", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf('<dc:identifier opf:Scheme="ISBN">0000000000</dc:identifier>'),
    )

    const xml = await buildPatchedOpfXml(entry, {
      identifiers: [{ scheme: "ISBN", value: "9783161484100" }],
    })

    expect(readOpfIsbn(xml)).toBe("9783161484100")
    expect(readOpfIdentifiers(xml)).toHaveLength(1)
    expect(xml).toContain("opf:Scheme")
    expect(xml).not.toContain("0000000000")
  })
})

describe("OPF editing alongside a valueless identifier element", () => {
  it("reconciles onto the tagged element and drops the empty one", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf(
        "<dc:identifier></dc:identifier>" +
          '<dc:identifier opf:scheme="ISBN">0000000000</dc:identifier>',
      ),
    )

    const xml = await buildPatchedOpfXml(entry, {
      identifiers: [{ scheme: "ISBN", value: "9783161484100" }],
    })

    expect(readOpfIdentifiers(xml)).toEqual([
      { value: "9783161484100", scheme: "ISBN" },
    ])
    expect(xml).not.toContain("0000000000")
  })

  it("keeps a scheme stated by an ONIX refinement on the element it refines", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf(
        '<dc:identifier id="book-id">0000000000</dc:identifier>' +
          '<meta refines="#book-id" property="identifier-type" scheme="onix:codelist5">15</meta>',
      ),
    )

    const xml = await buildPatchedOpfXml(entry, {
      identifiers: [{ scheme: "ISBN", value: "9783161484100" }],
    })

    expect(readOpfIsbn(xml)).toBe("9783161484100")
    expect(readOpfIdentifiers(xml)).toHaveLength(1)
    expect(xml).toContain('id="book-id"')
    expect(xml).toContain('refines="#book-id"')
  })
})

describe("OPF editing under an aliased namespace prefix", () => {
  const aliased = (metadata: string) =>
    '<?xml version="1.0" encoding="utf-8"?>' +
    '<package xmlns="http://www.idpf.org/2007/opf"' +
    ' xmlns:dc="http://purl.org/dc/elements/1.1/"' +
    ' xmlns:pkg="http://www.idpf.org/2007/opf"' +
    ' version="3.0" unique-identifier="pub-id">' +
    `<metadata>${metadata}</metadata><manifest/><spine/></package>`

  it("rewrites the aliased element rather than adding one beside it", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      aliased(
        '<dc:identifier id="isbn-id" pkg:scheme="ISBN">9783161484100</dc:identifier>' +
          '<meta refines="#isbn-id" property="display-seq">1</meta>',
      ),
    )

    const xml = await buildPatchedOpfXml(entry, {
      identifiers: [{ scheme: "ISBN", value: "9780306406157" }],
    })

    expect(readOpfIdentifiers(xml)).toEqual([
      { value: "9780306406157", scheme: "ISBN" },
    ])
    expect(xml).toContain('id="isbn-id"')
    expect(xml).toContain('refines="#isbn-id"')
    expect(xml.match(/scheme="/g)).toHaveLength(1)
  })

  it("clears an aliased scheme when the identifier becomes untagged", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      aliased('<dc:identifier pkg:scheme="ISBN">9783161484100</dc:identifier>'),
    )

    const xml = await buildPatchedOpfXml(entry, {
      identifiers: [{ scheme: "Unknown", value: "catalog-42" }],
    })

    expect(xml).not.toContain("scheme=")
    expect(readOpfIdentifiers(xml)).toEqual([
      { value: "catalog-42", scheme: "Unknown" },
    ])
  })

  it("writes a non-inferrable scheme a package with no opf prefix reads back", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      '<?xml version="1.0" encoding="utf-8"?>' +
        '<package xmlns="http://www.idpf.org/2007/opf"' +
        ' xmlns:dc="http://purl.org/dc/elements/1.1/"' +
        ' version="3.0" unique-identifier="pub-id">' +
        "<metadata/><manifest/><spine/></package>",
    )

    const xml = await buildPatchedOpfXml(entry, {
      identifiers: [{ scheme: "GoogleBooks", value: "zyTCAlFPjgYC" }],
    })

    expect(readOpfIdentifiers(xml)).toEqual([
      { value: "zyTCAlFPjgYC", scheme: "GoogleBooks" },
    ])
  })
})

describe("OPF editing an identifier that states no scheme", () => {
  it("edits the element whose value the reader reads as an ISBN", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf(
        `<dc:identifier id="pub-id">${UUID_IDENTIFIER}</dc:identifier>` +
          '<dc:identifier id="isbn-id">9783161484100</dc:identifier>' +
          '<meta refines="#isbn-id" property="display-seq">1</meta>',
      ),
    )

    const xml = await buildPatchedOpfXml(entry, {
      identifiers: [
        { scheme: "Unknown", value: UUID_IDENTIFIER, unique: true },
        { scheme: "ISBN", value: "9780306406157" },
      ],
    })

    expect(readOpfIsbn(xml)).toBe("9780306406157")
    expect(xml).toContain('id="isbn-id"')
    expect(xml).toContain('refines="#isbn-id"')
    expect(readOpfIdentifiers(xml)).toHaveLength(2)
  })

  it("leaves an element whose value announces nothing untagged", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf('<dc:identifier id="catalog-id">catalog-42</dc:identifier>'),
    )

    const xml = await buildPatchedOpfXml(entry, {
      identifiers: [{ scheme: "Unknown", value: "catalog-99" }],
    })

    expect(xml).toContain('id="catalog-id"')
    expect(xml).not.toContain("scheme=")
    expect(readOpfIdentifiers(xml)).toEqual([
      { value: "catalog-99", scheme: "Unknown" },
    ])
  })

  it("does not hand a bare UUID to a patched ISBN", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf(`<dc:identifier id="uuid-id">${UUID_IDENTIFIER}</dc:identifier>`),
    )

    const xml = await buildPatchedOpfXml(entry, {
      identifiers: [
        { scheme: "Unknown", value: UUID_IDENTIFIER },
        { scheme: "ISBN", value: "9783161484100" },
      ],
    })

    expect(xml).toContain(UUID_IDENTIFIER)
    expect(readOpfIsbn(xml)).toBe("9783161484100")
    expect(readOpfIdentifiers(xml)).toHaveLength(2)
  })
})
