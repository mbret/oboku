import type JSZip from "jszip"
import { applyMetadataPatchesToZip } from "../metadata/archiveFile"
import { loadArchive } from "../loadArchive"
import { compressArchiveImages } from "../content/compressArchiveImages"
import type { OptimizeOperation } from "./operations"

const EPUB_MIME_TYPE = "application/epub+zip"
const MIMETYPE_ENTRY = "mimetype"

const archiveHasOpf = (paths: string[]): boolean =>
  paths.some((path) => path.toLowerCase().endsWith(".opf"))

const resolvePatchedMimeType = (
  file: Blob | File,
  { hasOpf }: { hasOpf: boolean },
): string => {
  if (file.type) return file.type

  if (hasOpf) return EPUB_MIME_TYPE

  return "application/x-cbz"
}

/**
 * EPUB OCF requires the `mimetype` entry to be the archive's first record and
 * stored uncompressed. JSZip preserves neither across a load/generate
 * round-trip on its own, so we rewrite the entry as STORED and move it to the
 * front before packaging to keep the output valid for strict readers.
 */
const enforceEpubMimetypeFirst = (zip: JSZip): void => {
  zip.file(MIMETYPE_ENTRY, EPUB_MIME_TYPE, { compression: "STORE" })

  const mimetype = zip.files[MIMETYPE_ENTRY]

  if (!mimetype) return

  const reordered: typeof zip.files = { [MIMETYPE_ENTRY]: mimetype }

  for (const [name, entry] of Object.entries(zip.files)) {
    if (name !== MIMETYPE_ENTRY) reordered[name] = entry
  }

  zip.files = reordered
}

/**
 * Applies the curated operations to the book file and returns the resulting
 * file. This is the single transform shared by the apply step; persistence and
 * upload are deliberately left to the callers.
 */
export const produceOptimizedFile = async (
  file: File,
  operations: OptimizeOperation[],
  {
    onCompressionProgress,
  }: { onCompressionProgress?: (ratio: number) => void } = {},
): Promise<File> => {
  const { zip } = await loadArchive(file)

  for (const operation of operations) {
    if (operation.kind === "metadata-patch") {
      await applyMetadataPatchesToZip(zip, operation.patches)
    }
  }

  const compressOperation = operations.find(
    (operation) => operation.kind === "compress-images",
  )

  if (compressOperation) {
    onCompressionProgress?.(0)
    await compressArchiveImages(zip, compressOperation.config, {
      onProgress: (completed, total) => {
        onCompressionProgress?.(total > 0 ? completed / total : 0)
      },
    })
  }

  const hasOpf = archiveHasOpf(Object.keys(zip.files))

  if (hasOpf) enforceEpubMimetypeFirst(zip)

  const mimeType = resolvePatchedMimeType(file, { hasOpf })
  const blob = await zip.generateAsync({ type: "blob", mimeType })

  return new File([blob], file.name, { type: blob.type || mimeType })
}
