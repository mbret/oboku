import type { ArchiveEntry, ArchiveSource } from "@oboku/archive-metadata"
import type { Extractor } from "node-unrar-js"

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
): Uint8Array | undefined => {
  const extracted = extractor.extract({ files: [fileName] })
  const files = [...extracted.files]
  const file = files[0]

  return file?.extraction
}

/**
 * Adapt a `node-unrar-js` extractor to the runtime-agnostic
 * `ArchiveSource` interface consumed by `@oboku/archive-metadata`.
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
): ArchiveSource => {
  const list = extractor.getFileList()
  const headers = [...list.fileHeaders]

  const entries: ArchiveEntry[] = headers.map((header) => ({
    path: header.name,
    isDir: header.flags.directory,
    size: header.unpSize,
    readAsUint8Array: async () => {
      const bytes = extractEntryBytes(extractor, header.name)

      if (!bytes) {
        throw new Error(
          `node-unrar-js failed to extract entry "${header.name}" from the RAR archive`,
        )
      }

      return bytes
    },
    readAsString: async () => {
      const bytes = extractEntryBytes(extractor, header.name)

      if (!bytes) {
        throw new Error(
          `node-unrar-js failed to extract entry "${header.name}" from the RAR archive`,
        )
      }

      return new TextDecoder("utf-8").decode(bytes)
    },
  }))

  return {
    listEntries: async () => entries,
  }
}
