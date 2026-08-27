import {
  arrayBufferFileAccessors,
  createArchive,
  resolveArchive,
  type ArchiveRecord,
} from "@prose-reader/archive-reader"
import type { FileInspection } from "../useFileInspection"

const toArrayBuffer = (body: string): ArrayBuffer => {
  const bytes = new TextEncoder().encode(body)
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)

  return buffer
}

export const CONTAINER_XML =
  '<?xml version="1.0" encoding="utf-8"?>' +
  '<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">' +
  '<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>' +
  "</container>"

export const opf = (metadata: string): string =>
  '<?xml version="1.0" encoding="utf-8"?>' +
  '<package xmlns="http://www.idpf.org/2007/opf"' +
  ' xmlns:dc="http://purl.org/dc/elements/1.1/"' +
  ' xmlns:opf="http://www.idpf.org/2007/opf"' +
  ' version="3.0" unique-identifier="pub-id">' +
  `<metadata>${metadata}</metadata><manifest/><spine/>` +
  "</package>"

export const comicInfo = (body: string): string =>
  `<?xml version="1.0" encoding="utf-8"?><ComicInfo>${body}</ComicInfo>`

export const inspect = async (
  files: Record<string, string>,
): Promise<FileInspection> => {
  const records = Object.entries(files).map(
    ([uri, body]): ArchiveRecord => ({
      dir: false,
      basename: uri.split("/").filter(Boolean).pop() ?? uri,
      uri,
      size: body.length,
      ...arrayBufferFileAccessors(() => Promise.resolve(toArrayBuffer(body))),
    }),
  )
  const archive = createArchive({
    filename: "book.epub",
    records,
    close: () => Promise.resolve(),
  })

  return {
    fileName: "book.epub",
    fileSize: 0,
    fileCount: records.length,
    fileExtensions: [],
    imageCount: 0,
    imageBytes: 0,
    averageImageResolution: undefined,
    resolvedArchive: await resolveArchive(archive, {
      include: ["metadata", "sources"],
    }),
  }
}
