// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import {
  arrayBufferFileAccessors,
  createArchive,
  type ArchiveRecord,
} from "@prose-reader/archive-reader"
import { patchArchiveMetadata } from "./write"

const toArrayBuffer = (body: string): ArrayBuffer => {
  const bytes = new TextEncoder().encode(body)
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)

  return buffer
}

const record = (uri: string, body: string): ArchiveRecord => ({
  dir: false,
  basename: uri.split("/").filter(Boolean).pop() ?? uri,
  uri,
  size: body.length,
  ...arrayBufferFileAccessors(() => Promise.resolve(toArrayBuffer(body))),
})

const CONTAINER_XML =
  '<?xml version="1.0" encoding="utf-8"?>' +
  '<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">' +
  '<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>' +
  "</container>"

const OPF =
  '<?xml version="1.0" encoding="utf-8"?>' +
  '<package xmlns="http://www.idpf.org/2007/opf"' +
  ' xmlns:dc="http://purl.org/dc/elements/1.1/"' +
  ' xmlns:opf="http://www.idpf.org/2007/opf"' +
  ' version="3.0" unique-identifier="pub-id">' +
  '<metadata><dc:identifier id="pub-id">urn:uuid:abc</dc:identifier></metadata>' +
  "<manifest/><spine/></package>"

const epub = () =>
  createArchive({
    filename: "book.epub",
    records: [
      record("META-INF/container.xml", CONTAINER_XML),
      record("OEBPS/content.opf", OPF),
    ],
    close: () => Promise.resolve(),
  })

const ISBN_PATCH = { isbn: "9783161484100" }

describe("patchArchiveMetadata", () => {
  it("refuses a patch with no container to write it into", async () => {
    await expect(
      patchArchiveMetadata(epub(), ISBN_PATCH, { comicInfo: false }),
    ).rejects.toThrow(/requires at least one target/i)
  })

  it("writes only the containers it was asked for", async () => {
    const patched = await patchArchiveMetadata(epub(), ISBN_PATCH, {
      opf: true,
    })

    expect(
      patched.entries.map(function toPath({ path }) {
        return path
      }),
    ).toEqual(["OEBPS/content.opf"])
  })

  it("throws when asked for an OPF the archive does not carry", async () => {
    const comic = createArchive({
      filename: "book.cbz",
      records: [record("page-001.jpg", "binary")],
      close: () => Promise.resolve(),
    })

    await expect(
      patchArchiveMetadata(comic, ISBN_PATCH, { opf: true }),
    ).rejects.toThrow()
  })
})
