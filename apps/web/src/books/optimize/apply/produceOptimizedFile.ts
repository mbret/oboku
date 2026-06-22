import { type EditableArchive, readArchive } from "../archives/editableArchive"
import { writeArchive } from "../archives/writeArchive"
import { applyMetadataPatches } from "../metadata/archiveFile"
import { compressArchiveImages } from "../content/compressArchiveImages"
import type { OptimizeOperation } from "./operations"

const EPUB_MIME_TYPE = "application/epub+zip"
const MIMETYPE_ENTRY = "mimetype"

const archiveHasOpf = (paths: string[]): boolean =>
  paths.some((path) => path.toLowerCase().endsWith(".opf"))

const resolvePatchedMimeType = (
  type: string,
  { hasOpf }: { hasOpf: boolean },
): string => {
  if (type) return type

  if (hasOpf) return EPUB_MIME_TYPE

  return "application/x-cbz"
}

/**
 * EPUB OCF requires the `mimetype` entry to be the archive's first record and
 * stored uncompressed. We rewrite it as a STORED entry and move it to the front
 * (write order follows insertion order) so the output stays valid for strict
 * readers.
 */
const enforceEpubMimetypeFirst = (
  entries: EditableArchive,
): EditableArchive => {
  const reordered: EditableArchive = new Map()

  reordered.set(MIMETYPE_ENTRY, {
    dir: false,
    content: EPUB_MIME_TYPE,
    store: true,
  })

  for (const [path, entry] of entries) {
    if (path !== MIMETYPE_ENTRY) reordered.set(path, entry)
  }

  return reordered
}

export const produceOptimizedFile = async (
  file: File,
  operations: OptimizeOperation[],
  {
    onCompressionProgress,
  }: { onCompressionProgress?: (ratio: number) => void } = {},
): Promise<{ file: File; close: () => Promise<void> }> => {
  const { name, type } = file
  const { entries, close } = await readArchive(file)

  try {
    for (const operation of operations) {
      if (operation.kind === "metadata-patch") {
        await applyMetadataPatches(entries, operation.patches)
      }
    }

    const compressOperation = operations.find(
      (operation) => operation.kind === "compress-images",
    )

    if (compressOperation) {
      onCompressionProgress?.(0)
      await compressArchiveImages(entries, compressOperation.config, {
        onProgress: (completed, total) => {
          onCompressionProgress?.(total > 0 ? completed / total : 0)
        },
      })
    }

    const hasOpf = archiveHasOpf([...entries.keys()])
    const finalEntries = hasOpf ? enforceEpubMimetypeFirst(entries) : entries

    const mimeType = resolvePatchedMimeType(type, { hasOpf })
    const { blob, close: closeOutput } = await writeArchive(finalEntries)

    return {
      file: new File([blob], name, { type: mimeType }),
      close: closeOutput,
    }
  } finally {
    await close()
  }
}
