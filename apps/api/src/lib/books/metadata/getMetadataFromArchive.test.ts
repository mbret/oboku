import { describe, expect, it } from "vitest"
import {
  arrayBufferFileAccessors,
  createArchive,
} from "@prose-reader/archive-reader"
import { getMetadataFromArchive } from "./getMetadataFromArchive"

const toArrayBuffer = (body: string): ArrayBuffer => {
  const bytes = new TextEncoder().encode(body)
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)

  return buffer
}

const CONTAINER_XML =
  '<?xml version="1.0" encoding="utf-8"?>' +
  '<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">' +
  '<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>' +
  "</container>"

const opfWith = (identifiers: string): string =>
  '<?xml version="1.0" encoding="utf-8"?>' +
  '<package xmlns="http://www.idpf.org/2007/opf"' +
  ' xmlns:dc="http://purl.org/dc/elements/1.1/"' +
  ' xmlns:opf="http://www.idpf.org/2007/opf"' +
  ' version="3.0" unique-identifier="pub-id">' +
  `<metadata><dc:title>Sample</dc:title>${identifiers}</metadata>` +
  "<manifest/><spine/>" +
  "</package>"

const archiveOf = (filename: string, entries: Record<string, string>) =>
  createArchive({
    filename,
    records: Object.entries(entries).map(function toRecord([uri, body]) {
      return {
        dir: false,
        basename: uri.split("/").pop() ?? uri,
        uri,
        size: body.length,
        ...arrayBufferFileAccessors(function readBody() {
          return Promise.resolve(toArrayBuffer(body))
        }),
      }
    }),
    close: function closeArchive() {
      return Promise.resolve()
    },
  })

const archiveWith = (opf: string) =>
  archiveOf("book.epub", {
    "META-INF/container.xml": CONTAINER_XML,
    "OEBPS/content.opf": opf,
  })

const EPUB_CONTENT_TYPE = "application/epub+zip"

describe("getMetadataFromArchive", () => {
  it("advertises a GoogleBooks identifier as the google volume id", async () => {
    const archive = archiveWith(
      opfWith(
        '<dc:identifier opf:scheme="GoogleBooks">zyTCAlFPjgYC</dc:identifier>',
      ),
    )

    const metadata = await getMetadataFromArchive(archive, EPUB_CONTENT_TYPE)

    expect(metadata.googleVolumeId).toBe("zyTCAlFPjgYC")
    expect(metadata.title).toBe("Sample")
  })

  it("leaves the google volume id unset when no GoogleBooks identifier exists", async () => {
    const archive = archiveWith(
      opfWith('<dc:identifier opf:scheme="ISBN">9783161484100</dc:identifier>'),
    )

    const metadata = await getMetadataFromArchive(archive, EPUB_CONTENT_TYPE)

    expect(metadata.googleVolumeId).toBeUndefined()
    expect(metadata.isbn).toBe("9783161484100")
  })

  it("reads the volume id out of a catalog link, as a comic can only state one", async () => {
    const archive = archiveWith(
      opfWith(
        '<dc:identifier opf:scheme="ISBN">9783161484100</dc:identifier>' +
          '<dc:identifier opf:scheme="URL">https://books.google.com/books?id=zyTCAlFPjgYC</dc:identifier>',
      ),
    )

    const metadata = await getMetadataFromArchive(archive, EPUB_CONTENT_TYPE)

    expect(metadata.googleVolumeId).toBe("zyTCAlFPjgYC")
    expect(metadata.isbn).toBe("9783161484100")
  })

  it("does not mistake an unrelated link for a google volume id", async () => {
    const archive = archiveWith(
      opfWith(
        '<dc:identifier opf:scheme="URL">https://example.com/books?id=zyTCAlFPjgYC</dc:identifier>',
      ),
    )

    const metadata = await getMetadataFromArchive(archive, EPUB_CONTENT_TYPE)

    expect(metadata.googleVolumeId).toBeUndefined()
  })
})

describe("getMetadataFromArchive, the cover it reports", () => {
  const COMIC_CONTENT_TYPE = "application/x-cbz"

  it("declares a cover the package names", async () => {
    const archive = archiveOf("book.epub", {
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf":
        '<?xml version="1.0" encoding="utf-8"?>' +
        '<package xmlns="http://www.idpf.org/2007/opf"' +
        ' xmlns:dc="http://purl.org/dc/elements/1.1/"' +
        ' version="3.0" unique-identifier="pub-id">' +
        "<metadata><dc:title>Sample</dc:title></metadata>" +
        '<manifest><item id="cover" href="cover.jpg" media-type="image/jpeg"' +
        ' properties="cover-image"/></manifest><spine/>' +
        "</package>",
      "OEBPS/cover.jpg": "binary",
    })

    const metadata = await getMetadataFromArchive(archive, EPUB_CONTENT_TYPE)

    expect(metadata.coverLink).toBe("OEBPS/cover.jpg")
    expect(metadata.coverIsDeclared).toBe(true)
  })

  it("does not declare the first page of an archive that names none", async () => {
    const archive = archiveOf("book.cbz", {
      "page-001.jpg": "binary",
      "page-002.jpg": "binary",
    })

    const metadata = await getMetadataFromArchive(archive, COMIC_CONTENT_TYPE)

    expect(metadata.coverLink).toBe("page-001.jpg")
    expect(metadata.coverIsDeclared).toBe(false)
  })

  it("answers nothing when no cover is derivable", async () => {
    const metadata = await getMetadataFromArchive(
      archiveWith(opfWith("")),
      EPUB_CONTENT_TYPE,
    )

    expect(metadata.coverLink).toBeUndefined()
    expect(metadata.coverIsDeclared).toBeUndefined()
  })
})
