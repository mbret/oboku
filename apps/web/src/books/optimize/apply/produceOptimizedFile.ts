import {
  applyMetadataPatchesToZip,
  loadArchive,
  resolvePatchedMimeType,
} from "../metadata/archiveFile"
import { compressArchiveImages } from "../content/compressArchiveImages"
import type { OptimizeOperation } from "./operations"

const archiveHasOpf = (paths: string[]): boolean =>
  paths.some((path) => path.toLowerCase().endsWith(".opf"))

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
  const mimeType = resolvePatchedMimeType(file, { hasOpf })
  const blob = await zip.generateAsync({ type: "blob", mimeType })

  return new File([blob], file.name, { type: blob.type || mimeType })
}
