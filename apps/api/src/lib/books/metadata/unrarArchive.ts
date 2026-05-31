import type { Archive } from "@oboku/archive-metadata"
import { arrayBufferFileAccessors, createArchive } from "@prose-reader/streamer"
import type { Extractor } from "node-unrar-js"

const basename = (uri: string): string =>
  uri.split(/[\\/]/).filter(Boolean).pop() ?? uri

const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)

  return buffer
}

/**
 * Extract a single entry's bytes from a `node-unrar-js` extractor. The
 * library's `extract({ files })` returns a generator that holds
 * resources until consumed end-to-end — spreading into an array is the
 * documented way to free them (see `saveCoverFromRarArchiveToBucket`
 * for the same pattern on the cover path).
 */
const extractEntryBytes = (
  extractor: Extractor<Uint8Array>,
  fileName: string,
): Uint8Array => {
  const extracted = extractor.extract({ files: [fileName] })
  const files = [...extracted.files]
  const bytes = files[0]?.extraction

  if (!bytes) {
    throw new Error(
      `node-unrar-js failed to extract entry "${fileName}" from the RAR archive`,
    )
  }

  return bytes
}

/**
 * Adapt a `node-unrar-js` extractor to the {@link Archive} interface
 * consumed by `@oboku/archive-metadata`. There is no prose-reader helper
 * for RAR, so records are assembled by hand and handed to `createArchive`
 * (which derives the `recordsByUri` lookup index).
 *
 * Ownership stays with the caller: the extractor is created upstream
 * (see {@link getRarArchive}) and reused for both metadata parsing
 * *and* cover binary extraction. The adapter only holds a reference
 * and never disposes the extractor itself.
 *
 * The archive's file list comes from the already-loaded central
 * directory (the whole RAR is buffered in memory by `getRarArchive`),
 * so listing is effectively free and doesn't hit disk.
 */
export const createUnrarArchiveSource = (
  extractor: Extractor<Uint8Array>,
): Archive => {
  const list = extractor.getFileList()
  const headers = [...list.fileHeaders]

  return createArchive({
    records: headers.map((header): Archive["records"][number] => {
      const uri = header.name

      if (header.flags.directory) {
        return {
          dir: true,
          basename: basename(uri),
          uri,
        }
      }

      return {
        dir: false,
        basename: basename(uri),
        uri,
        size: header.unpSize,
        ...arrayBufferFileAccessors(async () =>
          toArrayBuffer(extractEntryBytes(extractor, uri)),
        ),
      }
    }),
    close: () => Promise.resolve(),
  })
}
