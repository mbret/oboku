import type JSZip from "jszip"
import { Logger } from "../../../debug/logger.shared"
import { isImagePath, replaceExtensionWithWebp } from "./images"
import { createImageCompressionPool } from "./imageCompressionPool"
import { mapWithConcurrency } from "./mapWithConcurrency"
import { rewriteImageReferences } from "./rewriteImageReferences"
import type { ImageCompressionConfig, ImageCompressionResult } from "./types"

type Rename = {
  oldPath: string
  newPath: string
  bytes: ArrayBuffer
}

export const compressArchiveImages = async (
  zip: JSZip,
  config: ImageCompressionConfig,
  {
    onProgress,
  }: { onProgress?: (completed: number, total: number) => void } = {},
): Promise<ImageCompressionResult> => {
  const images = Object.values(zip.files).filter(
    (entry) => !entry.dir && isImagePath(entry.name),
  )
  const total = images.length

  if (total === 0)
    return { totalImages: 0, compressedCount: 0, skippedCount: 0 }

  const pool = createImageCompressionPool()
  const renames: Rename[] = []
  let completed = 0
  let skippedCount = 0

  try {
    await mapWithConcurrency(
      images,
      navigator.hardwareConcurrency || 4,
      async (entry) => {
        const original = await entry.async("arraybuffer")
        const originalByteLength = original.byteLength
        const result = await pool.compress(
          original,
          config.maxWidth,
          config.maxHeight,
        )

        const isSmaller =
          result.status === "ok" && result.bytes.byteLength < originalByteLength

        if (result.status === "ok" && isSmaller) {
          renames.push({
            oldPath: entry.name,
            newPath: replaceExtensionWithWebp(entry.name),
            bytes: result.bytes,
          })
        } else {
          skippedCount += 1
        }

        completed += 1
        onProgress?.(completed, total)
      },
    )
  } finally {
    pool.terminate()
  }

  const renamedPaths = new Set<string>()

  for (const { oldPath, newPath, bytes } of renames) {
    if (newPath !== oldPath) {
      zip.remove(oldPath)
      renamedPaths.add(oldPath)
    }

    zip.file(newPath, new Uint8Array(bytes))
  }

  await rewriteImageReferences(zip, renamedPaths)

  Logger.info("[contentOptimizer] image compression", {
    totalImages: total,
    compressedCount: renames.length,
    skippedCount,
  })

  return {
    totalImages: total,
    compressedCount: renames.length,
    skippedCount,
  }
}
