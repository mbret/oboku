// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { parseOpf, resolveArchiveMetadata } from "@prose-reader/archive-parser"
import type { ArchiveEntry } from "../archive/types"
import { buildPatchedOpfXml } from "./write"

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

const makeEntry = (path: string, body: string): ArchiveEntry => ({
  path,
  isDir: false,
  readAsString: () => Promise.resolve(body),
  readAsUint8Array: () => Promise.resolve(new TextEncoder().encode(body)),
})

const readOpfMetadata = (xml: string) => resolveArchiveMetadata(parseOpf(xml))

describe("OPF editing (buildPatchedOpfXml)", () => {
  it('inserts a new opf:scheme="ISBN" identifier when the metadata had none', async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf(
        '<dc:identifier id="pub-id">urn:uuid:A1B0D67E-2E81-4DF5-9E67-A64CBE366809</dc:identifier>' +
          "<dc:title>Sample</dc:title>",
      ),
    )

    const xml = await buildPatchedOpfXml(entry, { isbn: "9783161484100" })

    expect(readOpfMetadata(xml).isbn).toBe("9783161484100")
    expect(xml).toContain("urn:uuid:A1B0D67E-2E81-4DF5-9E67-A64CBE366809")
    expect(xml).toContain("<dc:title>Sample</dc:title>")
  })

  it('updates the existing opf:scheme="ISBN" identifier in place', async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf(
        '<dc:identifier id="pub-id">urn:uuid:A1B0D67E-2E81-4DF5-9E67-A64CBE366809</dc:identifier>' +
          '<dc:identifier opf:scheme="ISBN">0000000000</dc:identifier>',
      ),
    )

    const xml = await buildPatchedOpfXml(entry, { isbn: "9783161484100" })

    expect(readOpfMetadata(xml).isbn).toBe("9783161484100")
    expect(xml).not.toContain("0000000000")
  })

  it("matches the scheme attribute case-insensitively when updating", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf('<dc:identifier opf:scheme="isbn">0000000000</dc:identifier>'),
    )

    const xml = await buildPatchedOpfXml(entry, { isbn: "9783161484100" })

    expect(readOpfMetadata(xml).isbn).toBe("9783161484100")
    expect(xml).not.toContain("0000000000")
  })

  it('matches a bare scheme="ISBN" attribute when updating', async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf('<dc:identifier scheme="ISBN">0000000000</dc:identifier>'),
    )

    const xml = await buildPatchedOpfXml(entry, { isbn: "9783161484100" })

    expect(readOpfMetadata(xml).isbn).toBe("9783161484100")
    expect(xml).not.toContain("0000000000")
  })

  it("never touches a UUID identifier carrying the unique-identifier id", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf(
        '<dc:identifier id="pub-id">urn:uuid:A1B0D67E-2E81-4DF5-9E67-A64CBE366809</dc:identifier>',
      ),
    )

    const xml = await buildPatchedOpfXml(entry, { isbn: "9783161484100" })

    expect(xml).toContain("urn:uuid:A1B0D67E-2E81-4DF5-9E67-A64CBE366809")
    expect(xml).toContain('id="pub-id"')
  })

  it("removes the ISBN identifier when the patch clears it with undefined", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf(
        '<dc:identifier id="pub-id">urn:uuid:A1B0D67E-2E81-4DF5-9E67-A64CBE366809</dc:identifier>' +
          '<dc:identifier opf:scheme="ISBN">9783161484100</dc:identifier>',
      ),
    )

    const xml = await buildPatchedOpfXml(entry, { isbn: undefined })

    expect(readOpfMetadata(xml).isbn).toBeUndefined()
    expect(xml).toContain("urn:uuid:A1B0D67E-2E81-4DF5-9E67-A64CBE366809")
  })

  it("removes the ISBN identifier when the patch clears it with an empty string", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf('<dc:identifier opf:scheme="ISBN">9783161484100</dc:identifier>'),
    )

    const xml = await buildPatchedOpfXml(entry, { isbn: "" })

    expect(readOpfMetadata(xml).isbn).toBeUndefined()
  })

  it("does nothing when clearing an already-absent ISBN", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf(
        '<dc:identifier id="pub-id">urn:uuid:A1B0D67E-2E81-4DF5-9E67-A64CBE366809</dc:identifier>',
      ),
    )

    const xml = await buildPatchedOpfXml(entry, { isbn: undefined })

    expect(readOpfMetadata(xml).isbn).toBeUndefined()
    expect(xml).toContain("urn:uuid:A1B0D67E-2E81-4DF5-9E67-A64CBE366809")
  })

  it("preserves unrelated metadata fields when inserting an ISBN", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf(
        "<dc:title>Norwegian Wood</dc:title>" +
          "<dc:creator>Haruki Murakami</dc:creator>" +
          "<dc:publisher>Vintage</dc:publisher>" +
          "<dc:language>en</dc:language>",
      ),
    )

    const xml = await buildPatchedOpfXml(entry, { isbn: "9783161484100" })

    expect(readOpfMetadata(xml)).toMatchObject({
      title: "Norwegian Wood",
      authors: ["Haruki Murakami"],
      publisher: "Vintage",
      languages: ["en"],
      isbn: "9783161484100",
    })
  })

  it("preserves manifest and spine when inserting an ISBN", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf("<dc:title>Sample</dc:title>", {
        manifest:
          '<item id="ci" href="cover.png" media-type="image/png" properties="cover-image"/>' +
          '<item id="ch1" href="text/ch1.xhtml" media-type="application/xhtml+xml"/>',
        spine: '<itemref idref="ch1"/>',
      }),
    )

    const xml = await buildPatchedOpfXml(entry, { isbn: "9783161484100" })

    expect(readOpfMetadata(xml)).toMatchObject({
      isbn: "9783161484100",
    })
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

    const xml = await buildPatchedOpfXml(entry, { isbn: "9783161484100" })

    expect(xml.startsWith("<?xml")).toBe(true)
  })

  it("throws when the OPF root element is not <package>", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      '<?xml version="1.0" encoding="utf-8"?><notpackage/>',
    )

    await expect(
      buildPatchedOpfXml(entry, { isbn: "9783161484100" }),
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
      buildPatchedOpfXml(entry, { isbn: "9783161484100" }),
    ).rejects.toThrow(/has no <metadata> element/i)
  })

  it("propagates a labelled parse error when the OPF is malformed", async () => {
    const entry = makeEntry("OEBPS/content.opf", "<package><metadata>")

    await expect(
      buildPatchedOpfXml(entry, { isbn: "9783161484100" }),
    ).rejects.toThrow(/OPF is malformed/i)
  })

  it("round-trips: the patched output parses back to the patched ISBN", async () => {
    const entry = makeEntry(
      "OEBPS/content.opf",
      opf("<dc:title>Sample</dc:title>"),
    )

    const xml = await buildPatchedOpfXml(entry, {
      isbn: "9783161484100",
    })

    expect(readOpfMetadata(xml).isbn).toBe("9783161484100")
  })
})
